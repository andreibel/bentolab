package io.bento.kafka.event;

import java.util.UUID;

public record PasswordResetRequestedEvent(
        String eventType,
        UUID userId,
        String email,
        String token,
        String expiresAt
) {
    public PasswordResetRequestedEvent(UUID userId, String email, String token, String expiresAt) {
        this("PasswordResetRequestedEvent", userId, email, token, expiresAt);
    }
}
