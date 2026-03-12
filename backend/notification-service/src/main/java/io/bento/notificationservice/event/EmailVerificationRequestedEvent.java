package io.bento.notificationservice.event;

import java.time.Instant;

public record EmailVerificationRequestedEvent(
        String userId,
        String email,
        String token,
        Instant expiresAt
) {}
