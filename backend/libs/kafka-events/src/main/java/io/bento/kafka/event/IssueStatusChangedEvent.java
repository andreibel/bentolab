package io.bento.kafka.event;

import java.util.List;

public record IssueStatusChangedEvent(
        String eventType,
        String issueId,
        String boardId,
        String orgId,
        String issueKey,
        String issueTitle,
        String fromColumnName,
        String toColumnName,
        String changedByUserId,
        String assigneeId,
        String reporterId,
        List<String> watcherIds,
        String changedAt
) {
    public IssueStatusChangedEvent(String issueId, String boardId, String orgId, String issueKey,
                                    String issueTitle, String fromColumnName, String toColumnName,
                                    String changedByUserId, String assigneeId, String reporterId,
                                    List<String> watcherIds, String changedAt) {
        this("IssueStatusChangedEvent", issueId, boardId, orgId, issueKey, issueTitle,
                fromColumnName, toColumnName, changedByUserId, assigneeId, reporterId,
                watcherIds, changedAt);
    }
}
