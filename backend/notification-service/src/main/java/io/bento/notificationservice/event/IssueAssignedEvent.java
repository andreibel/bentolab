package io.bento.notificationservice.event;

public record IssueAssignedEvent(
        String eventType,
        String issueId,
        String boardId,
        String orgId,
        String issueKey,
        String issueTitle,
        String assigneeId,
        String assignedByUserId,
        String assignedAt
) {}
