package io.bento.taskservice.event;

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
) {
    public SprintStartedEvent(String sprintId, String boardId, String orgId, String sprintName,
                               String startDate, String endDate, List<String> memberIds) {
        this("SprintStartedEvent", sprintId, boardId, orgId, sprintName, startDate, endDate, memberIds);
    }
}
