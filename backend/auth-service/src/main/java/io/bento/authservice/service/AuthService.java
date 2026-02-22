package io.bento.authservice.service;

import io.bento.authservice.dto.request.LoginRequest;
import io.bento.authservice.dto.request.RegisterRequest;
import io.bento.authservice.dto.response.*;
import io.bento.authservice.entity.RefreshToken;
import io.bento.authservice.entity.User;
import io.bento.authservice.enums.SystemRole;
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

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .systemRole(SystemRole.USER)
                .active(true)
                .emailVerified(false)
                .build();
        user = userRepository.save(user);

        // TODO: Publish user.registered Kafka event

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

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new BadCredentialsException("Account is deactivated");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        // TODO: Publish user.logged_in Kafka event

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
    public TokenResponse refresh(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenService.validateRefreshToken(refreshTokenValue);
        User user = refreshToken.getUser();

        List<UserOrgDto> organizations = fetchUserOrganizations(user.getId());
        UserOrgDto primaryOrg = organizations.isEmpty() ? null : organizations.getFirst();

        String accessToken = jwtService.generateAccessToken(user, primaryOrg);

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
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user, null, null);

        return new TokenResponse(accessToken, refreshToken.getToken());
    }

    /**
     * Stub: returns empty list until Org Service is implemented.
     */
    private List<UserOrgDto> fetchUserOrganizations(UUID userId) {
        // TODO: Call Org Service GET /api/internal/orgs/user/{userId}
        return List.of();
    }
}
