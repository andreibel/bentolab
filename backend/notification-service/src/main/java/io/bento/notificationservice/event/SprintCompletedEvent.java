package io.bento.notificationservice.event;

public record SprintCompletedEvent(
        String sprintId,
        String boardId,
        String orgId,
        String sprintName,
        int completedIssues,
        int remainingIssues
) {}
