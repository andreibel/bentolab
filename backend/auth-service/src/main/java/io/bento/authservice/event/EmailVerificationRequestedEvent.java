package io.bento.authservice.event;

import java.util.UUID;

public record EmailVerificationRequestedEvent(
        String eventType,
        UUID userId,
        String email,
        String token,
        String expiresAt
) {
    public EmailVerificationRequestedEvent(UUID userId, String email, String token, String expiresAt) {
        this("EmailVerificationRequestedEvent", userId, email, token, expiresAt);
    }
}
