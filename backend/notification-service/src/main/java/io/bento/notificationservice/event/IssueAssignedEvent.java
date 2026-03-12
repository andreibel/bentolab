package io.bento.notificationservice.event;

public record IssueAssignedEvent(
        String issueId,
        String boardId,
        String orgId,
        String issueKey,
        String issueTitle,
        String assigneeUserId,
        String assignedByUserId
) {}
