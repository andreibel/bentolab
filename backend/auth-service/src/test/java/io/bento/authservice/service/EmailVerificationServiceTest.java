package io.bento.authservice.service;

import io.bento.authservice.entity.EmailVerificationToken;
import io.bento.authservice.entity.User;
import io.bento.authservice.enums.SystemRole;
import io.bento.authservice.event.EmailVerificationRequestedEvent;
import io.bento.authservice.event.UserEventPublisher;
import io.bento.authservice.exception.InvalidTokenException;
import io.bento.authservice.repository.EmailVerificationTokenRepository;
import io.bento.authservice.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock private EmailVerificationTokenRepository tokenRepository;
    @Mock private UserRepository userRepository;
    @Mock private UserEventPublisher userEventPublisher;

    @InjectMocks private EmailVerificationService emailVerificationService;

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    // =========================================================================
    // generateAndSend
    // =========================================================================

    @Test
    void generateAndSend_invalidatesExistingTokensForUser() {
        User user = user();
        when(tokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        emailVerificationService.generateAndSend(user);

        verify(tokenRepository).invalidateAllByUserId(USER_ID);
    }

    @Test
    void generateAndSend_savesNewTokenWithCorrectExpiry() {
        User user = user();
        when(tokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        emailVerificationService.generateAndSend(user);

        ArgumentCaptor<EmailVerificationToken> captor =
                ArgumentCaptor.forClass(EmailVerificationToken.class);
        verify(tokenRepository).save(captor.capture());

        EmailVerificationToken saved = captor.getValue();
        assertThat(saved.getUser()).isEqualTo(user);
        assertThat(saved.isUsed()).isFalse();
        assertThat(saved.getToken()).isNotBlank();
        assertThat(saved.getExpiresAt()).isAfter(Instant.now().plus(23, ChronoUnit.HOURS));
        assertThat(saved.getExpiresAt()).isBefore(Instant.now().plus(25, ChronoUnit.HOURS));
    }

    @Test
    void generateAndSend_publishesEventWithCorrectData() {
        User user = user();
        when(tokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        emailVerificationService.generateAndSend(user);

        ArgumentCaptor<EmailVerificationRequestedEvent> captor =
                ArgumentCaptor.forClass(EmailVerificationRequestedEvent.class);
        verify(userEventPublisher).publishEmailVerificationRequested(captor.capture());

        EmailVerificationRequestedEvent event = captor.getValue();
        assertThat(event.userId()).isEqualTo(USER_ID);
        assertThat(event.email()).isEqualTo("john@example.com");
        assertThat(event.token()).isNotBlank();
        assertThat(event.expiresAt()).isNotBlank();
    }

    // =========================================================================
    // verify
    // =========================================================================

    @Test
    void verify_validToken_setsEmailVerifiedAndMarksTokenUsed() {
        User user = user();
        EmailVerificationToken token = validToken(user);

        when(tokenRepository.findByToken("valid-tok")).thenReturn(Optional.of(token));
        when(tokenRepository.save(any())).thenReturn(token);

        emailVerificationService.verify("valid-tok");

        assertThat(token.isUsed()).isTrue();
        assertThat(user.isEmailVerified()).isTrue();
        verify(tokenRepository).save(token);
        verify(userRepository).save(user);
    }

    @Test
    void verify_unknownToken_throwsInvalidTokenException() {
        when(tokenRepository.findByToken("bad-tok")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> emailVerificationService.verify("bad-tok"))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void verify_alreadyUsedToken_throwsInvalidTokenException() {
        User user = user();
        EmailVerificationToken token = EmailVerificationToken.builder()
                .user(user).token("used-tok")
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .used(true).build();

        when(tokenRepository.findByToken("used-tok")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> emailVerificationService.verify("used-tok"))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("already been used");

        verify(userRepository, never()).save(any());
    }

    @Test
    void verify_expiredToken_throwsInvalidTokenException() {
        User user = user();
        EmailVerificationToken token = EmailVerificationToken.builder()
                .user(user).token("exp-tok")
                .expiresAt(Instant.now().minusSeconds(1))
                .used(false).build();

        when(tokenRepository.findByToken("exp-tok")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> emailVerificationService.verify("exp-tok"))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("expired");

        verify(userRepository, never()).save(any());
    }

    // =========================================================================
    // resendVerification
    // =========================================================================

    @Test
    void resendVerification_unverifiedUser_generatesAndSendsNewToken() {
        User user = user(); // emailVerified = false by default
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(tokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        emailVerificationService.resendVerification("john@example.com");

        verify(tokenRepository).invalidateAllByUserId(USER_ID);
        verify(tokenRepository).save(any(EmailVerificationToken.class));
        verify(userEventPublisher).publishEmailVerificationRequested(any());
    }

    @Test
    void resendVerification_alreadyVerifiedUser_doesNothing() {
        User user = user();
        user.setEmailVerified(true);
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));

        emailVerificationService.resendVerification("john@example.com");

        verify(tokenRepository, never()).save(any());
        verify(userEventPublisher, never()).publishEmailVerificationRequested(any());
    }

    @Test
    void resendVerification_unknownEmail_doesNothingAndDoesNotThrow() {
        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        emailVerificationService.resendVerification("nobody@example.com");

        verify(tokenRepository, never()).save(any());
        verify(userEventPublisher, never()).publishEmailVerificationRequested(any());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private User user() {
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

    private EmailVerificationToken validToken(User user) {
        return EmailVerificationToken.builder()
                .user(user)
                .token("valid-tok")
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .used(false)
                .build();
    }
}
