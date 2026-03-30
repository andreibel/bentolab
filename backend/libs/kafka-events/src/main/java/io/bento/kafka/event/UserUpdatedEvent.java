package io.bento.kafka.event;

import java.util.List;
import java.util.UUID;

public record UserUpdatedEvent(
        String eventType,
        UUID userId,
        List<String> changedFields,
        String updatedAt
) {
    public UserUpdatedEvent(UUID userId, List<String> changedFields, String updatedAt) {
        this("UserUpdatedEvent", userId, changedFields, updatedAt);
    }
}
