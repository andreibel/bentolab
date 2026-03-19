package io.bento.kafka.event;

import java.util.UUID;

public record UserLoggedInEvent(
        String eventType,
        UUID userId,
        String deviceInfo,
        String loggedInAt
) {
    public UserLoggedInEvent(UUID userId, String deviceInfo, String loggedInAt) {
        this("UserLoggedInEvent", userId, deviceInfo, loggedInAt);
    }
}
