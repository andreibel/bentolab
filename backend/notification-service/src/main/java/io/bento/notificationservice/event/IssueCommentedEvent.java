package io.bento.notificationservice.event;

public record IssueCommentedEvent(
        String issueId,
        String boardId,
        String orgId,
        String issueKey,
        String issueTitle,
        String commentAuthorUserId,
        String assigneeUserId
) {}
