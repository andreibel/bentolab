package io.bento.authservice.service;

import io.bento.authservice.config.AuthProperties;
import io.bento.authservice.dto.request.LoginRequest;
import io.bento.authservice.dto.request.RegisterRequest;
import io.bento.authservice.dto.response.AuthResponse;
import io.bento.authservice.dto.response.TokenResponse;
import io.bento.authservice.dto.response.UserDto;
import io.bento.authservice.dto.response.UserOrgDto;
import io.bento.authservice.entity.RefreshToken;
import io.bento.authservice.entity.User;
import io.bento.authservice.enums.SystemRole;
import io.bento.authservice.event.UserEventPublisher;
import io.bento.authservice.event.UserLoggedInEvent;
import io.bento.authservice.event.UserRegisteredEvent;
import io.bento.authservice.exception.EmailAlreadyExistsException;
import io.bento.authservice.exception.UserNotFoundException;
import io.bento.authservice.mapper.UserMapper;
import io.bento.authservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private UserMapper userMapper;
    @Mock private AuthProperties authProperties;
    @Mock private UserEventPublisher userEventPublisher;
    @Mock private OrgServiceClient orgServiceClient;
    @Mock private EmailVerificationService emailVerificationService;

    @InjectMocks private AuthService authService;

    private static final String PEPPER = "test-pepper";
    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID ORG_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @BeforeEach
    void setUp() {
        // lenient: pepper is only consumed by register/login paths, not by refresh/logout/switchOrg
        lenient().when(authProperties.pepper()).thenReturn(PEPPER);
    }

    // =========================================================================
    // register
    // =========================================================================

    @Test
    void register_newEmail_savesUserAndReturnsTokens() {
        User saved = activeUser();
        UserOrgDto org = orgDto();
        UserDto dto = userDto();

        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenReturn(saved);
        when(orgServiceClient.getUserOrgs(USER_ID)).thenReturn(List.of(org));
        when(jwtService.generateAccessToken(saved, org)).thenReturn("access-token");
        when(refreshTokenService.createRefreshToken(eq(saved), isNull(), isNull()))
                .thenReturn(refreshToken("refresh-token", saved));
        when(userMapper.toDto(saved)).thenReturn(dto);

        AuthResponse response = authService.register(
                new RegisterRequest("john@example.com", "Password1!", "John", "Doe"));

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isEqualTo("refresh-token");
        assertThat(response.user()).isEqualTo(dto);
        assertThat(response.organizations()).containsExactly(org);
    }

    @Test
    void register_newEmail_publishesUserRegisteredEvent() {
        User saved = activeUser();
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any())).thenReturn(saved);
        when(orgServiceClient.getUserOrgs(any())).thenReturn(List.of());
        when(jwtService.generateAccessToken(any(), any())).thenReturn("tok");
        when(refreshTokenService.createRefreshToken(any(), any(), any()))
                .thenReturn(refreshToken("tok", saved));
        when(userMapper.toDto(any())).thenReturn(userDto());

        authService.register(new RegisterRequest("john@example.com", "Password1!", "John", "Doe"));

        ArgumentCaptor<UserRegisteredEvent> captor = ArgumentCaptor.forClass(UserRegisteredEvent.class);
        verify(userEventPublisher).publishUserRegistered(captor.capture());
        assertThat(captor.getValue().email()).isEqualTo(saved.getEmail());
        assertThat(captor.getValue().userId()).isEqualTo(USER_ID);
    }

    @Test
    void register_newEmail_triggersEmailVerification() {
        User saved = activeUser();
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any())).thenReturn(saved);
        when(orgServiceClient.getUserOrgs(any())).thenReturn(List.of());
        when(jwtService.generateAccessToken(any(), any())).thenReturn("tok");
        when(refreshTokenService.createRefreshToken(any(), any(), any()))
                .thenReturn(refreshToken("tok", saved));
        when(userMapper.toDto(any())).thenReturn(userDto());

        authService.register(new RegisterRequest("john@example.com", "Password1!", "John", "Doe"));

        verify(emailVerificationService).generateAndSend(saved);
    }

    @Test
    void register_emailAlreadyExists_throwsEmailAlreadyExistsException() {
        when(userRepository.existsByEmail("dup@example.com")).thenReturn(true);

        assertThatThrownBy(() ->
                authService.register(new RegisterRequest("dup@example.com", "Password1!", "John", "Doe")))
                .isInstanceOf(EmailAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
        verify(userEventPublisher, never()).publishUserRegistered(any());
        verify(emailVerificationService, never()).generateAndSend(any());
    }

    @Test
    void register_noOrganizations_usesNullOrgForToken() {
        User saved = activeUser();
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any())).thenReturn(saved);
        when(orgServiceClient.getUserOrgs(any())).thenReturn(List.of());
        when(jwtService.generateAccessToken(saved, null)).thenReturn("tok");
        when(refreshTokenService.createRefreshToken(any(), any(), any()))
                .thenReturn(refreshToken("tok", saved));
        when(userMapper.toDto(any())).thenReturn(userDto());

        AuthResponse response = authService.register(
                new RegisterRequest("john@example.com", "Password1!", "John", "Doe"));

        assertThat(response.organizations()).isEmpty();
        verify(jwtService).generateAccessToken(saved, null);
    }

    // =========================================================================
    // login
    // =========================================================================

    @Test
    void login_validCredentials_returnsAuthResponse() {
        User user = activeUser();
        UserOrgDto org = orgDto();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(orgServiceClient.getUserOrgs(USER_ID)).thenReturn(List.of(org));
        when(jwtService.generateAccessToken(user, org)).thenReturn("access-token");
        when(refreshTokenService.createRefreshToken(eq(user), isNull(), isNull()))
                .thenReturn(refreshToken("refresh-token", user));
        when(userMapper.toDto(user)).thenReturn(userDto());

        AuthResponse response = authService.login(new LoginRequest("john@example.com", "Password1!"));

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isEqualTo("refresh-token");
    }

    @Test
    void login_validCredentials_updatesLastLoginAtAndPublishesEvent() {
        User user = activeUser();

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(orgServiceClient.getUserOrgs(any())).thenReturn(List.of());
        when(jwtService.generateAccessToken(any(), any())).thenReturn("tok");
        when(refreshTokenService.createRefreshToken(any(), any(), any()))
                .thenReturn(refreshToken("tok", user));
        when(userMapper.toDto(any())).thenReturn(userDto());

        authService.login(new LoginRequest("john@example.com", "Password1!"));

        assertThat(user.getLastLoginAt()).isNotNull();
        verify(userRepository).save(user);
        verify(userEventPublisher).publishUserLoggedIn(any(UserLoggedInEvent.class));
    }

    @Test
    void login_unknownEmail_throwsBadCredentials() {
        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("nobody@example.com", "pass")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_wrongPassword_throwsBadCredentials() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(activeUser()));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("john@example.com", "wrong")))
                .isInstanceOf(BadCredentialsException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void login_inactiveAccount_throwsBadCredentials() {
        User inactive = User.builder()
                .id(USER_ID).email("john@example.com").password("hashed")
                .firstName("John").lastName("Doe").active(false).build();

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(inactive));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.login(new LoginRequest("john@example.com", "pass")))
                .isInstanceOf(BadCredentialsException.class);
    }

    // =========================================================================
    // refresh
    // =========================================================================

    @Test
    void refresh_validToken_preservesCurrentOrgContext() {
        User user = activeUser();
        RefreshToken rt = refreshToken("refresh-tok", user);
        UserOrgDto org = orgDto();

        when(refreshTokenService.validateRefreshToken("refresh-tok")).thenReturn(rt);
        when(orgServiceClient.getUserOrgs(USER_ID)).thenReturn(List.of(org));
        when(jwtService.generateAccessToken(user, org)).thenReturn("new-access-token");

        TokenResponse response = authService.refresh("refresh-tok", ORG_ID);

        assertThat(response.accessToken()).isEqualTo("new-access-token");
        assertThat(response.refreshToken()).isEqualTo("refresh-tok");
    }

    @Test
    void refresh_currentOrgNotInUserOrgs_fallsBackToFirstOrg() {
        User user = activeUser();
        RefreshToken rt = refreshToken("tok", user);
        UserOrgDto first = orgDto();
        UUID unknownOrg = UUID.randomUUID();

        when(refreshTokenService.validateRefreshToken("tok")).thenReturn(rt);
        when(orgServiceClient.getUserOrgs(USER_ID)).thenReturn(List.of(first));
        when(jwtService.generateAccessToken(eq(user), eq(first))).thenReturn("tok");

        authService.refresh("tok", unknownOrg);

        verify(jwtService).generateAccessToken(user, first);
    }

    @Test
    void refresh_nullCurrentOrgId_usesFirstOrg() {
        User user = activeUser();
        RefreshToken rt = refreshToken("tok", user);
        UserOrgDto first = orgDto();

        when(refreshTokenService.validateRefreshToken("tok")).thenReturn(rt);
        when(orgServiceClient.getUserOrgs(USER_ID)).thenReturn(List.of(first));
        when(jwtService.generateAccessToken(eq(user), eq(first))).thenReturn("tok");

        authService.refresh("tok", null);

        verify(jwtService).generateAccessToken(user, first);
    }

    @Test
    void refresh_noOrganizations_generatesTokenWithNullOrg() {
        User user = activeUser();
        RefreshToken rt = refreshToken("tok", user);

        when(refreshTokenService.validateRefreshToken("tok")).thenReturn(rt);
        when(orgServiceClient.getUserOrgs(USER_ID)).thenReturn(List.of());
        when(jwtService.generateAccessToken(eq(user), isNull())).thenReturn("tok");

        authService.refresh("tok", null);

        verify(jwtService).generateAccessToken(user, null);
    }

    // =========================================================================
    // logout
    // =========================================================================

    @Test
    void logout_delegatesToRefreshTokenService() {
        authService.logout("refresh-tok");
        verify(refreshTokenService).revokeToken("refresh-tok");
    }

    // =========================================================================
    // switchOrg
    // =========================================================================

    @Test
    void switchOrg_validOrg_updatesCurrentOrgIdAndReturnsToken() {
        User user = activeUser();
        UserOrgDto org = orgDto();

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(orgServiceClient.getUserOrgs(USER_ID)).thenReturn(List.of(org));
        when(jwtService.generateAccessToken(user, org)).thenReturn("new-token");
        when(refreshTokenService.getOrCreateActiveToken(user)).thenReturn(refreshToken("refresh-tok", user));

        TokenResponse response = authService.switchOrg(USER_ID, ORG_ID);

        assertThat(response.accessToken()).isEqualTo("new-token");
        assertThat(user.getCurrentOrgId()).isEqualTo(ORG_ID);
        verify(userRepository).save(user);
    }

    @Test
    void switchOrg_orgNotInUserList_generatesTokenWithNullOrg() {
        User user = activeUser();
        UUID unknownOrg = UUID.randomUUID();

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(orgServiceClient.getUserOrgs(USER_ID)).thenReturn(List.of(orgDto()));
        when(jwtService.generateAccessToken(eq(user), isNull())).thenReturn("tok");
        when(refreshTokenService.getOrCreateActiveToken(user)).thenReturn(refreshToken("tok", user));

        authService.switchOrg(USER_ID, unknownOrg);

        verify(jwtService).generateAccessToken(user, null);
    }

    @Test
    void switchOrg_userNotFound_throwsUserNotFoundException() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.switchOrg(USER_ID, ORG_ID))
                .isInstanceOf(UserNotFoundException.class);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private User activeUser() {
        return User.builder()
                .id(USER_ID)
                .email("john@example.com")
                .password("hashed")
                .firstName("John")
                .lastName("Doe")
                .systemRole(SystemRole.USER)
                .active(true)
                .emailVerified(false)
                .build();
    }

    private UserOrgDto orgDto() {
        return new UserOrgDto(ORG_ID, "Acme", "acme", "OWNER", null);
    }

    private RefreshToken refreshToken(String token, User user) {
        return RefreshToken.builder()
                .token(token)
                .user(user)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .build();
    }

    private UserDto userDto() {
        return new UserDto(USER_ID, "john@example.com", "John", "Doe",
                null, SystemRole.USER, false, null, null, Instant.now());
    }
}
