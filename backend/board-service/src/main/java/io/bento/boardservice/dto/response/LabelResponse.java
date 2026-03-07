package io.bento.boardservice.dto.response;

import java.time.Instant;
import java.util.UUID;

public record LabelResponse(
        UUID id,
        UUID boardId,
        UUID orgId,
        String name,
        String color,
        String description,
        Instant createdAt
) {}
