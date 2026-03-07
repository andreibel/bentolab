package io.bento.boardservice.dto.response;

import io.bento.boardservice.enums.BoardType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BoardResponse(
        UUID id,
        UUID orgId,
        String name,
        String description,
        String boardKey,
        BoardType boardType,
        String background,
        UUID ownerId,
        Boolean isArchived,
        Integer issueCounter,
        List<BoardColumnResponse> columns,
        Instant createdAt,
        Instant updatedAt
) {}
