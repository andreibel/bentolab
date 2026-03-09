package io.bento.taskservice.dto.response;

import io.bento.taskservice.entity.embedded.ChecklistItem;
import io.bento.taskservice.entity.embedded.ColumnHistoryEntry;
import io.bento.taskservice.enums.IssuePriority;
import io.bento.taskservice.enums.IssueSeverity;
import io.bento.taskservice.enums.IssueType;

import java.time.Instant;
import java.util.List;

public record IssueResponse(
        String id,
        String orgId,
        String boardId,
        String issueKey,
        IssueType type,
        IssuePriority priority,
        IssueSeverity severity,
        String title,
        String description,
        String columnId,
        Integer position,
        String reporterId,
        String assigneeId,
        List<String> watcherIds,
        Instant startDate,
        Instant dueDate,
        Instant completedAt,
        Instant resolvedAt,
        Double estimatedHours,
        Double totalTimeSpent,
        Double remainingHours,
        Integer storyPoints,
        String sprintId,
        String epicId,
        String parentIssueId,
        List<String> labelIds,
        List<String> components,
        List<ChecklistItem> checklist,
        List<ColumnHistoryEntry> columnHistory,
        Integer reassignmentCount,
        Integer commentCount,
        Integer statusChangeCount,
        String createdBy,
        Instant createdAt,
        Instant updatedAt
) {}
