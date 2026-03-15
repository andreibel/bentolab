package io.bento.notificationservice.event;

import java.util.List;

public record IssueStatusChangedEvent(
        String eventType,
        String issueId,
        String boardId,
        String orgId,
        String issueKey,
        String issueTitle,
        String fromColumnName,
        String toColumnName,
        String changedByUserId,
        String assigneeId,
        String reporterId,
        List<String> watcherIds,
        String changedAt
) {}
