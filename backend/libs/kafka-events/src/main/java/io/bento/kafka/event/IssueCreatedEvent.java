package io.bento.kafka.event;

public record IssueCreatedEvent(
        String eventType,
        String issueId,
        String boardId,
        String orgId,
        String issueKey,
        String title,
        String columnId,
        String createdByUserId,
        String assigneeId,
        String createdAt
) {
    public IssueCreatedEvent(String issueId, String boardId, String orgId, String issueKey,
                              String title, String columnId, String createdByUserId,
                              String assigneeId, String createdAt) {
        this("IssueCreatedEvent", issueId, boardId, orgId, issueKey, title, columnId,
                createdByUserId, assigneeId, createdAt);
    }
}