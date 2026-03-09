package io.bento.taskservice.entity;

import io.bento.taskservice.entity.embedded.ActivityDetails;
import io.bento.taskservice.enums.ActivityAction;
import io.bento.taskservice.enums.EntityType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "activities")
@CompoundIndexes({
        @CompoundIndex(name = "idx_org_issue_created", def = "{'orgId': 1, 'issueId': 1, 'createdAt': 1}"),
        @CompoundIndex(name = "idx_org_board_created", def = "{'orgId': 1, 'boardId': 1, 'createdAt': 1}"),
        @CompoundIndex(name = "idx_org_user_created", def = "{'orgId': 1, 'userId': 1, 'createdAt': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Activity {

    @Id
    private String id;

    private String orgId;
    private String issueId;
    private String boardId;
    private String sprintId;
    private String userId;

    private EntityType entityType;
    private ActivityAction action;
    private ActivityDetails details;

    private Instant createdAt;
}
