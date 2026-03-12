package io.bento.notificationservice.event;

import java.time.Instant;

public record UserRegisteredEvent(
        String userId,
        String email,
        String firstName,
        String lastName,
        Instant registeredAt
) {}
