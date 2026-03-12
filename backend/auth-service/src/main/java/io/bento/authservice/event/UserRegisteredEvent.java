package io.bento.authservice.event;

import java.util.UUID;

public record UserRegisteredEvent(
        String eventType,
        UUID userId,
        String email,
        String firstName,
        String lastName,
        String registeredAt
) {
    public UserRegisteredEvent(UUID userId, String email, String firstName, String lastName, String registeredAt) {
        this("UserRegisteredEvent", userId, email, firstName, lastName, registeredAt);
    }
}
