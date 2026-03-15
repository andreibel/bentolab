package io.bento.notificationservice.event;

import java.util.List;

public record SprintStartedEvent(
        String eventType,
        String sprintId,
        String boardId,
        String orgId,
        String sprintName,
        String startDate,
        String endDate,
        List<String> memberIds
) {}
