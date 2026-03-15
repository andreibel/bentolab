package io.bento.notificationservice.event;

import java.util.List;

public record SprintCompletedEvent(
        String eventType,
        String sprintId,
        String boardId,
        String orgId,
        String sprintName,
        int completedIssues,
        int remainingIssues,
        List<String> memberIds
) {}
