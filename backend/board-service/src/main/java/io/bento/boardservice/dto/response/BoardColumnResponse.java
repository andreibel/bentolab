package io.bento.boardservice.dto.response;

import java.time.Instant;
import java.util.UUID;

public record BoardColumnResponse(
        UUID id,
        UUID boardId,
        String name,
        Integer position,
        String color,
        Integer wipLimit,
        Boolean isInitial,
        Boolean isFinal,
        Instant createdAt
) {}
