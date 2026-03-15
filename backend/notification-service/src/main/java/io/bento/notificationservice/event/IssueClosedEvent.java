package io.bento.notificationservice.event;

public record IssueClosedEvent(
        String eventType,
        String issueId,
        String boardId,
        String orgId,
        String issueKey,
        String issueTitle,
        String closedByUserId,
        String assigneeId,
        String reporterId,
        String closedAt
) {}
