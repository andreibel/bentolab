package io.bento.taskservice.dto.response;

import io.bento.taskservice.enums.MilestoneStatus;

import java.time.Instant;

public record MilestoneResponse(
        String id,
        String orgId,
        String boardId,
        String title,
        String description,
        Instant date,
        String color,
        MilestoneStatus status,
        String createdBy,
        Instant createdAt,
        Instant updatedAt
) {}