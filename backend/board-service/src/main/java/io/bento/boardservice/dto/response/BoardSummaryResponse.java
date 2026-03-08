package io.bento.boardservice.dto.response;

import io.bento.boardservice.enums.BoardType;

import java.time.Instant;
import java.util.UUID;

public record BoardSummaryResponse(
        UUID id,
        String name,
        String boardKey,
        BoardType boardType,
        String background,
        Boolean isArchived,
        Instant createdAt
) {}
