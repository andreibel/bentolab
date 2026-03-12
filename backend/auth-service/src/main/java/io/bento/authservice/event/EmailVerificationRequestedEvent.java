package io.bento.authservice.event;

import java.util.UUID;

public record EmailVerificationRequestedEvent(
        UUID userId,
        String email,
        String token,
        String expiresAt
) {}
