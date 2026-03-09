package io.bento.taskservice.dto.response;

import io.bento.taskservice.entity.embedded.Retrospective;
import io.bento.taskservice.entity.embedded.ScopeChanges;
import io.bento.taskservice.enums.SprintStatus;

import java.time.Instant;

public record SprintResponse(
        String id,
        String orgId,
        String boardId,
        String name,
        String goal,
        SprintStatus status,
        Instant startDate,
        Instant endDate,
        Integer duration,
        Integer totalPoints,
        Integer completedPoints,
        Integer totalIssues,
        Integer completedIssues,
        Double velocity,
        ScopeChanges scopeChanges,
        Retrospective retrospective,
        String createdBy,
        Instant createdAt,
        Instant completedAt
) {}
