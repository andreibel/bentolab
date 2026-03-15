package io.bento.taskservice.event;

public record IssueAssignedEvent(
        String eventType,
        String issueId,
        String boardId,
        String orgId,
        String issueKey,
        String issueTitle,
        String assigneeId,
        String assignedByUserId,
        String assignedAt
) {
    public IssueAssignedEvent(String issueId, String boardId, String orgId, String issueKey,
                               String issueTitle, String assigneeId, String assignedByUserId,
                               String assignedAt) {
        this("IssueAssignedEvent", issueId, boardId, orgId, issueKey, issueTitle,
                assigneeId, assignedByUserId, assignedAt);
    }
}