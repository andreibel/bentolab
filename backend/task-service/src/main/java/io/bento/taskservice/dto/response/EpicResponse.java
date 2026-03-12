package io.bento.taskservice.dto.response;

import io.bento.taskservice.enums.EpicStatus;

import java.time.Instant;

public record EpicResponse(
        String id,
        String orgId,
        String boardId,
        String title,
        String description,
        String color,
        EpicStatus status,
        Instant startDate,
        Instant endDate,
        String ownerId,
        long issueCount,
        Instant createdAt,
        Instant updatedAt
) {}