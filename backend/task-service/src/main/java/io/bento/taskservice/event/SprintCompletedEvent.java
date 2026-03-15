package io.bento.taskservice.event;

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
) {
    public SprintCompletedEvent(String sprintId, String boardId, String orgId, String sprintName,
                                 int completedIssues, int remainingIssues, List<String> memberIds) {
        this("SprintCompletedEvent", sprintId, boardId, orgId, sprintName,
                completedIssues, remainingIssues, memberIds);
    }
}
