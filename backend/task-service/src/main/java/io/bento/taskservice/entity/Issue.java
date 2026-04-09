package io.bento.taskservice.entity;

import io.bento.taskservice.entity.embedded.ChecklistItem;
import io.bento.taskservice.entity.embedded.ColumnHistoryEntry;
import io.bento.taskservice.enums.IssuePriority;
import io.bento.taskservice.enums.IssueSeverity;
import io.bento.taskservice.enums.IssueType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "issues")
@CompoundIndexes({
        @CompoundIndex(name = "idx_org_board", def = "{'orgId': 1, 'boardId': 1}"),
        @CompoundIndex(name = "idx_org_issue_key", def = "{'orgId': 1, 'issueKey': 1}", unique = true),
        @CompoundIndex(name = "idx_org_assignee", def = "{'orgId': 1, 'assigneeId': 1}"),
        @CompoundIndex(name = "idx_org_sprint", def = "{'orgId': 1, 'sprintId': 1}"),
        @CompoundIndex(name = "idx_org_epic", def = "{'orgId': 1, 'epicId': 1}"),
        @CompoundIndex(name = "idx_org_type", def = "{'orgId': 1, 'type': 1}"),
        @CompoundIndex(name = "idx_org_due_date", def = "{'orgId': 1, 'dueDate': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Issue {

    @Id
    private String id;

    private String orgId;
    private String boardId;
    private String issueKey;        // e.g. "TF-42"

    // Classification
    private IssueType type;
    private IssuePriority priority;
    private IssueSeverity severity; // bugs only

    // Content
    private String title;
    private String description;     // markdown

    // Position — columnId is source of truth for status
    private String columnId;
    private Integer position;

    // People
    private String reporterId;
    private String assigneeId;
    private List<String> watcherIds;

    // Dates
    private Instant startDate;
    private Instant dueDate;
    private Instant completedAt;
    private Instant resolvedAt;

    // Time Tracking
    private Double estimatedHours;
    private Double totalTimeSpent;
    private Double remainingHours;

    // Scrum
    private Integer storyPoints;
    private String sprintId;
    private String epicId;
    private String parentIssueId;
    private String milestoneId;

    // Organization
    private List<String> labelIds;
    private List<String> components;

    // Dependencies: list of issue IDs that must be completed before this issue starts
    private List<String> dependencyIds;

    // Attachments (IDs referencing attacment-service)
    private List<String> attachmentIds;

    // Embedded
    private List<ChecklistItem> checklist;
    private List<ColumnHistoryEntry> columnHistory;

    // Counters
    @Builder.Default
    private Integer reassignmentCount = 0;
    @Builder.Default
    private Integer commentCount = 0;
    @Builder.Default
    private Integer statusChangeCount = 0;

    // Lifecycle
    @Builder.Default
    private Boolean closed = false;
    private Instant closedAt;

    // Metadata
    private String createdBy;
    private Instant createdAt;
    private Instant updatedAt;
}
