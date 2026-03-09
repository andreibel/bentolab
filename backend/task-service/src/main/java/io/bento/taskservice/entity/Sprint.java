package io.bento.taskservice.entity;

import io.bento.taskservice.entity.embedded.Retrospective;
import io.bento.taskservice.entity.embedded.ScopeChanges;
import io.bento.taskservice.enums.SprintStatus;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "sprints")
@CompoundIndexes({
        @CompoundIndex(name = "idx_org_board", def = "{'orgId': 1, 'boardId': 1}"),
        @CompoundIndex(name = "idx_org_status", def = "{'orgId': 1, 'status': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Sprint {

    @Id
    private String id;

    private String orgId;
    private String boardId;
    private String name;            // "Sprint 23"
    private String goal;
    private SprintStatus status;

    private Instant startDate;
    private Instant endDate;
    @Builder.Default
    private Integer duration = 14;  // days

    // Metrics
    @Builder.Default
    private Integer totalPoints = 0;
    @Builder.Default
    private Integer completedPoints = 0;
    @Builder.Default
    private Integer totalIssues = 0;
    @Builder.Default
    private Integer completedIssues = 0;
    private Double velocity;

    // Embedded
    @Builder.Default
    private ScopeChanges scopeChanges = new ScopeChanges();
    private Retrospective retrospective;

    private String createdBy;
    private Instant createdAt;
    private Instant completedAt;
}
