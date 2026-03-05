package io.bento.authservice.event;

import java.util.List;
import java.util.UUID;

public record UserUpdatedEvent(
        UUID userId,
        List<String> changedFields,
        String updatedAt
) {}
