package io.bento.notificationservice.event;

import java.util.List;

public record IssueCommentedEvent(
        String eventType,
        String issueId,
        String boardId,
        String orgId,
        String issueKey,
        String issueTitle,
        String commentId,
        String authorUserId,
        String assigneeId,
        List<String> watcherIds,
        List<String> mentionedUserIds,
        String commentedAt
) {}
