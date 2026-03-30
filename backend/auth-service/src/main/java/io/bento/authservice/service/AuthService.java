package io.bento.authservice.service;

import io.bento.authservice.config.AuthProperties;
import io.bento.authservice.dto.request.LoginRequest;
import io.bento.authservice.dto.request.RegisterRequest;
import io.bento.authservice.dto.response.*;
import io.bento.authservice.entity.RefreshToken;
import io.bento.authservice.entity.User;
import io.bento.authservice.enums.SystemRole;
import io.bento.authservice.event.UserEventPublisher;
import io.bento.kafka.event.UserLoggedInEvent;
import io.bento.kafka.event.UserRegisteredEvent;
import io.bento.authservice.exception.EmailAlreadyExistsException;
import io.bento.authservice.exception.UserNotFoundException;
import io.bento.authservice.mapper.UserMapper;
import io.bento.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserMapper userMapper;
    private final AuthProperties authProperties;
    private final UserEventPublisher userEventPublisher;
    private final OrgServiceClient orgServiceClient;
    private final EmailVerificationService emailVerificationService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {

        // Check if email already exists before creating user to avoid unnecessary work and potential conflicts
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        // Create new user with default values and hashed password
        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password() + authProperties.pepper()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .systemRole(SystemRole.USER)
                .active(true)
                .emailVerified(false)
                .build();
        user = userRepository.save(user);

        userEventPublisher.publishUserRegistered(new UserRegisteredEvent(
                user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(), Instant.now().toString()
        ));

        emailVerificationService.generateAndSend(user);

        List<UserOrgDto> organizations = fetchUserOrganizations(user.getId());
        UserOrgDto primaryOrg = organizations.isEmpty() ? null : organizations.getFirst();

        String accessToken = jwtService.generateAccessToken(user, primaryOrg);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user, null, null);

        return new AuthResponse(
                accessToken,
                refreshToken.getToken(),
                userMapper.toDto(user),
                organizations
        );
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password() + authProperties.pepper(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new BadCredentialsException("Account is deactivated");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        userEventPublisher.publishUserLoggedIn(new UserLoggedInEvent(user.getId(), null, Instant.now().toString()));

        List<UserOrgDto> organizations = fetchUserOrganizations(user.getId());
        UserOrgDto primaryOrg = organizations.isEmpty() ? null : organizations.getFirst();

        String accessToken = jwtService.generateAccessToken(user, primaryOrg);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user, null, null);

        return new AuthResponse(
                accessToken,
                refreshToken.getToken(),
                userMapper.toDto(user),
                organizations
        );
    }

    @Transactional
    public TokenResponse refresh(String refreshTokenValue, UUID currentOrgId) {
        RefreshToken refreshToken = refreshTokenService.validateRefreshToken(refreshTokenValue);
        User user = refreshToken.getUser();

        List<UserOrgDto> organizations = fetchUserOrganizations(user.getId());

        // Try to preserve the org context the client was in. If the user was removed
        // from that org, org-service will no longer return it → fall back to first org.
        UserOrgDto targetOrg = null;
        if (currentOrgId != null) {
            targetOrg = organizations.stream()
                    .filter(o -> o.orgId().equals(currentOrgId))
                    .findFirst()
                    .orElse(null);
        }
        if (targetOrg == null) {
            targetOrg = organizations.isEmpty() ? null : organizations.getFirst();
        }

        String accessToken = jwtService.generateAccessToken(user, targetOrg);
        return new TokenResponse(accessToken, refreshToken.getToken());
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        refreshTokenService.revokeToken(refreshTokenValue);
    }

    @Transactional
    public TokenResponse switchOrg(UUID userId, UUID orgId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // TODO: Call Org Service to verify user belongs to org and get role
        // For now, just update currentOrgId
        user.setCurrentOrgId(orgId);
        userRepository.save(user);

        List<UserOrgDto> organizations = fetchUserOrganizations(userId);
        UserOrgDto targetOrg = organizations.stream()
                .filter(org -> org.orgId().equals(orgId))
                .findFirst()
                .orElse(null);

        String accessToken = jwtService.generateAccessToken(user, targetOrg);
        RefreshToken refreshToken = refreshTokenService.getOrCreateActiveToken(user);

        return new TokenResponse(accessToken, refreshToken.getToken());
    }

    private List<UserOrgDto> fetchUserOrganizations(UUID userId) {
        return orgServiceClient.getUserOrgs(userId);
    }
}
