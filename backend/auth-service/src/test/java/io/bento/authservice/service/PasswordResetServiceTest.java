package io.bento.authservice.service;

import io.bento.authservice.config.AuthProperties;
import io.bento.authservice.entity.PasswordResetToken;
import io.bento.authservice.entity.User;
import io.bento.authservice.enums.SystemRole;
import io.bento.authservice.event.PasswordResetRequestedEvent;
import io.bento.authservice.event.UserEventPublisher;
import io.bento.authservice.exception.InvalidTokenException;
import io.bento.authservice.repository.PasswordResetTokenRepository;
import io.bento.authservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock private PasswordResetTokenRepository tokenRepository;
    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthProperties authProperties;
    @Mock private UserEventPublisher userEventPublisher;

    @InjectMocks private PasswordResetService passwordResetService;

    private static final String PEPPER = "test-pepper";
    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @BeforeEach
    void setUp() {
        // lenient: pepper is only consumed by resetPassword, not by requestReset/error paths
        lenient().when(authProperties.pepper()).thenReturn(PEPPER);
    }

    // =========================================================================
    // requestReset
    // =========================================================================

    @Test
    void requestReset_knownEmail_invalidatesOldTokensAndSavesNew() {
        User user = user();
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(tokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        passwordResetService.requestReset("john@example.com");

        verify(tokenRepository).invalidateAllByUserId(USER_ID);
        ArgumentCaptor<PasswordResetToken> captor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(captor.capture());

        PasswordResetToken saved = captor.getValue();
        assertThat(saved.getUser()).isEqualTo(user);
        assertThat(saved.isUsed()).isFalse();
        assertThat(saved.getToken()).isNotBlank();
        assertThat(saved.getExpiresAt()).isAfter(Instant.now().plus(55, ChronoUnit.MINUTES));
        assertThat(saved.getExpiresAt()).isBefore(Instant.now().plus(65, ChronoUnit.MINUTES));
    }

    @Test
    void requestReset_knownEmail_publishesEventWithCorrectData() {
        User user = user();
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(tokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        passwordResetService.requestReset("john@example.com");

        ArgumentCaptor<PasswordResetRequestedEvent> captor =
                ArgumentCaptor.forClass(PasswordResetRequestedEvent.class);
        verify(userEventPublisher).publishPasswordResetRequested(captor.capture());

        PasswordResetRequestedEvent event = captor.getValue();
        assertThat(event.userId()).isEqualTo(USER_ID);
        assertThat(event.email()).isEqualTo("john@example.com");
        assertThat(event.token()).isNotBlank();
        assertThat(event.expiresAt()).isNotBlank();
    }

    @Test
    void requestReset_unknownEmail_doesNothingAndDoesNotThrow() {
        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        passwordResetService.requestReset("nobody@example.com");

        verify(tokenRepository, never()).save(any());
        verify(userEventPublisher, never()).publishPasswordResetRequested(any());
    }

    // =========================================================================
    // resetPassword
    // =========================================================================

    @Test
    void resetPassword_validToken_updatesPasswordWithPepper() {
        User user = user();
        PasswordResetToken token = validToken(user);

        when(tokenRepository.findByToken("valid-tok")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode(anyString())).thenReturn("new-hashed");
        when(tokenRepository.save(any())).thenReturn(token);

        passwordResetService.resetPassword("valid-tok", "NewPassword1!");

        ArgumentCaptor<String> encodedCaptor = ArgumentCaptor.forClass(String.class);
        verify(passwordEncoder).encode(encodedCaptor.capture());
        assertThat(encodedCaptor.getValue()).isEqualTo("NewPassword1!" + PEPPER);
        assertThat(user.getPassword()).isEqualTo("new-hashed");
    }

    @Test
    void resetPassword_validToken_marksTokenUsed() {
        User user = user();
        PasswordResetToken token = validToken(user);

        when(tokenRepository.findByToken("valid-tok")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode(anyString())).thenReturn("new-hashed");
        when(tokenRepository.save(any())).thenReturn(token);

        passwordResetService.resetPassword("valid-tok", "NewPassword1!");

        assertThat(token.isUsed()).isTrue();
        verify(tokenRepository).save(token);
    }

    @Test
    void resetPassword_validToken_revokesAllRefreshTokens() {
        User user = user();
        PasswordResetToken token = validToken(user);

        when(tokenRepository.findByToken("valid-tok")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode(anyString())).thenReturn("new-hashed");
        when(tokenRepository.save(any())).thenReturn(token);

        passwordResetService.resetPassword("valid-tok", "NewPassword1!");

        verify(refreshTokenService).revokeAllUserTokens(USER_ID);
    }

    @Test
    void resetPassword_unknownToken_throwsInvalidTokenException() {
        when(tokenRepository.findByToken("bad-tok")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> passwordResetService.resetPassword("bad-tok", "Pass1!"))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("not found");

        verify(userRepository, never()).save(any());
    }

    @Test
    void resetPassword_alreadyUsedToken_throwsInvalidTokenException() {
        User user = user();
        PasswordResetToken token = PasswordResetToken.builder()
                .user(user).token("used-tok")
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .used(true).build();

        when(tokenRepository.findByToken("used-tok")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.resetPassword("used-tok", "Pass1!"))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("already been used");

        verify(userRepository, never()).save(any());
        verify(refreshTokenService, never()).revokeAllUserTokens(any());
    }

    @Test
    void resetPassword_expiredToken_throwsInvalidTokenException() {
        User user = user();
        PasswordResetToken token = PasswordResetToken.builder()
                .user(user).token("exp-tok")
                .expiresAt(Instant.now().minusSeconds(1))
                .used(false).build();

        when(tokenRepository.findByToken("exp-tok")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.resetPassword("exp-tok", "Pass1!"))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("expired");

        verify(userRepository, never()).save(any());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private User user() {
        return User.builder()
                .id(USER_ID)
                .email("john@example.com")
                .password("old-hashed")
                .firstName("John")
                .lastName("Doe")
                .systemRole(SystemRole.USER)
                .active(true)
                .emailVerified(true)
                .build();
    }

    private PasswordResetToken validToken(User user) {
        return PasswordResetToken.builder()
                .user(user)
                .token("valid-tok")
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .used(false)
                .build();
    }
}
