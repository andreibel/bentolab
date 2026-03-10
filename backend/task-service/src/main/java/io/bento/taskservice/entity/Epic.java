package io.bento.taskservice.entity;

import io.bento.taskservice.enums.EpicStatus;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "epics")
@CompoundIndexes({
        @CompoundIndex(name = "idx_epic_org_board", def = "{'orgId': 1, 'boardId': 1}"),
        @CompoundIndex(name = "idx_epic_org_id",    def = "{'orgId': 1, 'id': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Epic {

    @Id
    private String id;

    private String orgId;
    private String boardId;

    private String title;
    private String description;

    /** Hex color used as a label tag, e.g. "#6366f1" */
    private String color;

    @Builder.Default
    private EpicStatus status = EpicStatus.OPEN;

    private Instant startDate;
    private Instant endDate;

    private String ownerId;   // creator / responsible user

    private Instant createdAt;
    private Instant updatedAt;
}