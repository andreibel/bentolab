package io.bento.notificationservice.event;

public record IssuePriorityChangedEvent(
        String eventType,
        String issueId,
        String boardId,
        String orgId,
        String issueKey,
        String issueTitle,
        String oldPriority,
        String newPriority,
        String changedByUserId,
        String assigneeId,
        String changedAt
) {}
