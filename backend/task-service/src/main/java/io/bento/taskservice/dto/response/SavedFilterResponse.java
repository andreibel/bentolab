package io.bento.taskservice.dto.response;

import io.bento.taskservice.entity.embedded.FilterCriteria;

import java.time.Instant;

public record SavedFilterResponse(
        String id,
        String boardId,
        String userId,
        String name,
        Boolean isShared,
        FilterCriteria filters,
        Instant createdAt
) {}
