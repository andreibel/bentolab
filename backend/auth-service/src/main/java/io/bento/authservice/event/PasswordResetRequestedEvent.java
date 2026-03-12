package io.bento.authservice.event;

import java.util.UUID;

public record PasswordResetRequestedEvent(
        UUID userId,
        String email,
        String token,
        String expiresAt
) {}
