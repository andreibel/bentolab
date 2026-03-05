package io.bento.authservice.event;

import java.time.Instant;
import java.util.UUID;

public record UserLoggedInEvent(
        UUID userId,
        String deviceInfo,
        Instant loggedInAt
) {}