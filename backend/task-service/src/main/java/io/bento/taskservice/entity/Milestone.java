package io.bento.taskservice.entity;

import io.bento.taskservice.enums.MilestoneStatus;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "milestones")
@CompoundIndexes({
        @CompoundIndex(name = "idx_milestone_org_board", def = "{'orgId': 1, 'boardId': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Milestone {

    @Id
    private String id;

    private String orgId;
    private String boardId;

    private String title;
    private String description;

    private Instant date;

    /** Hex color, e.g. "#f59e0b" */
    private String color;

    @Builder.Default
    private MilestoneStatus status = MilestoneStatus.PLANNED;

    private String createdBy;
    private Instant createdAt;
    private Instant updatedAt;
}