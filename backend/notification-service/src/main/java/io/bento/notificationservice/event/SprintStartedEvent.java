package io.bento.notificationservice.event;

import java.time.Instant;

public record SprintStartedEvent(
        String sprintId,
        String boardId,
        String orgId,
        String sprintName,
        Instant startDate,
        Instant endDate
) {}
