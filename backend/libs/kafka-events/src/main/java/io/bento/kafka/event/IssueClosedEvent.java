package io.bento.kafka.event;

public record IssueClosedEvent(
        String eventType,
        String issueId,
        String boardId,
        String orgId,
        String issueKey,
        String issueTitle,
        String closedByUserId,
        String assigneeId,
        String reporterId,
        String closedAt
) {
    public IssueClosedEvent(String issueId, String boardId, String orgId, String issueKey,
                             String issueTitle, String closedByUserId, String assigneeId,
                             String reporterId, String closedAt) {
        this("IssueClosedEvent", issueId, boardId, orgId, issueKey, issueTitle,
                closedByUserId, assigneeId, reporterId, closedAt);
    }
}
