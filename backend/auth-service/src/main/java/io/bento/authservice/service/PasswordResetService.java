package io.bento.authservice.service;

import io.bento.authservice.config.AuthProperties;
import io.bento.authservice.entity.PasswordResetToken;
import io.bento.authservice.entity.User;
import io.bento.kafka.event.PasswordResetRequestedEvent;
import io.bento.authservice.event.UserEventPublisher;
import io.bento.authservice.exception.InvalidTokenException;
import io.bento.authservice.repository.PasswordResetTokenRepository;
import io.bento.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PasswordResetService {

    private static final long EXPIRATION_HOURS = 1;

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;
    private final AuthProperties authProperties;
    private final UserEventPublisher userEventPublisher;

    @Transactional
    public void requestReset(String email) {
        // Silently ignore unknown emails to prevent enumeration
        userRepository.findByEmail(email).ifPresent(user -> {
            tokenRepository.invalidateAllByUserId(user.getId());

            Instant expiresAt = Instant.now().plus(EXPIRATION_HOURS, ChronoUnit.HOURS);
            PasswordResetToken token = PasswordResetToken.builder()
                    .user(user)
                    .token(UUID.randomUUID().toString())
                    .expiresAt(expiresAt)
                    .build();
            token = tokenRepository.save(token);

            userEventPublisher.publishPasswordResetRequested(new PasswordResetRequestedEvent(
                    user.getId(), user.getEmail(), token.getToken(), expiresAt.toString()
            ));
        });
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        PasswordResetToken token = tokenRepository.findByToken(rawToken)
                .orElseThrow(() -> new InvalidTokenException("Password reset token not found"));

        if (token.isUsed()) {
            throw new InvalidTokenException("Password reset token has already been used");
        }
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidTokenException("Password reset token has expired");
        }

        token.setUsed(true);
        tokenRepository.save(token);

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword + authProperties.pepper()));
        userRepository.save(user);

        // Revoke all active sessions after password change
        refreshTokenService.revokeAllUserTokens(user.getId());
    }
}
