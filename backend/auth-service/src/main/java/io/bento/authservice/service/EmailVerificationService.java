package io.bento.authservice.service;

import io.bento.authservice.entity.EmailVerificationToken;
import io.bento.authservice.entity.User;
import io.bento.kafka.event.EmailVerificationRequestedEvent;
import io.bento.authservice.event.UserEventPublisher;
import io.bento.authservice.exception.InvalidTokenException;
import io.bento.authservice.repository.EmailVerificationTokenRepository;
import io.bento.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmailVerificationService {

    private static final long EXPIRATION_HOURS = 24;

    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final UserEventPublisher userEventPublisher;

    @Transactional
    public void generateAndSend(User user) {
        tokenRepository.invalidateAllByUserId(user.getId());

        Instant expiresAt = Instant.now().plus(EXPIRATION_HOURS, ChronoUnit.HOURS);
        EmailVerificationToken token = EmailVerificationToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiresAt(expiresAt)
                .build();
        token = tokenRepository.save(token);

        userEventPublisher.publishEmailVerificationRequested(new EmailVerificationRequestedEvent(
                user.getId(), user.getEmail(), token.getToken(), expiresAt.toString()
        ));
    }

    @Transactional
    public void verify(String rawToken) {
        EmailVerificationToken token = tokenRepository.findByToken(rawToken)
                .orElseThrow(() -> new InvalidTokenException("Email verification token not found"));

        if (token.isUsed()) {
            throw new InvalidTokenException("Email verification token has already been used");
        }
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidTokenException("Email verification token has expired");
        }

        token.setUsed(true);
        tokenRepository.save(token);

        User user = token.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
    }

    @Transactional
    public void resendVerification(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            if (!user.isEmailVerified()) {
                generateAndSend(user);
            }
        });
    }
}
