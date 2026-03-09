package io.bento.taskservice.dto.response;

import io.bento.taskservice.enums.IssuePriority;
import io.bento.taskservice.enums.IssueType;

import java.time.Instant;

public record IssueSummaryResponse(
        String id,
        String issueKey,
        IssueType type,
        IssuePriority priority,
        String title,
        String columnId,
        Integer position,
        String assigneeId,
        String sprintId,
        Integer storyPoints,
        Integer commentCount,
        Instant dueDate,
        Instant createdAt
) {}
