package io.bento.taskservice.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "time_logs")
@CompoundIndexes({
        @CompoundIndex(name = "idx_org_issue", def = "{'orgId': 1, 'issueId': 1}"),
        @CompoundIndex(name = "idx_org_user_date", def = "{'orgId': 1, 'userId': 1, 'date': 1}"),
        @CompoundIndex(name = "idx_org_board_date", def = "{'orgId': 1, 'boardId': 1, 'date': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeLog {

    @Id
    private String id;

    private String orgId;
    private String issueId;
    private String userId;
    private String boardId;
    private Double hoursSpent;
    private Instant date;           // work date
    private String description;
    private Instant createdAt;
}
