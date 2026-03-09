package io.bento.taskservice.dto.response;

import io.bento.taskservice.entity.embedded.ActivityDetails;
import io.bento.taskservice.enums.ActivityAction;
import io.bento.taskservice.enums.EntityType;

import java.time.Instant;

public record ActivityResponse(
        String id,
        String userId,
        EntityType entityType,
        ActivityAction action,
        ActivityDetails details,
        Instant createdAt
) {}
