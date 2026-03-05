package io.bento.authservice.event;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserUpdatedEvent(
        UUID userId,
        List<String> changedFields,
        Instant updatedAt
) {}