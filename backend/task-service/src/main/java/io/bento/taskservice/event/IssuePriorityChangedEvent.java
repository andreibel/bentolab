package io.bento.taskservice.event;

public record IssuePriorityChangedEvent(
        String eventType,
        String issueId,
        String boardId,
        String orgId,
        String issueKey,
        String issueTitle,
        String oldPriority,
        String newPriority,
        String changedByUserId,
        String assigneeId,
        String changedAt
) {
    public IssuePriorityChangedEvent(String issueId, String boardId, String orgId, String issueKey,
                                      String issueTitle, String oldPriority, String newPriority,
                                      String changedByUserId, String assigneeId, String changedAt) {
        this("IssuePriorityChangedEvent", issueId, boardId, orgId, issueKey, issueTitle,
                oldPriority, newPriority, changedByUserId, assigneeId, changedAt);
    }
}
