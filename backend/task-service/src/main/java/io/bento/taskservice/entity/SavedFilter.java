package io.bento.taskservice.entity;

import io.bento.taskservice.entity.embedded.FilterCriteria;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "saved_filters")
@CompoundIndexes({
        @CompoundIndex(name = "idx_org_board_user", def = "{'orgId': 1, 'boardId': 1, 'userId': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedFilter {

    @Id
    private String id;

    private String orgId;
    private String boardId;
    private String userId;
    private String name;            // "My Bugs"
    @Builder.Default
    private Boolean isShared = false;
    private FilterCriteria filters;
    private Instant createdAt;
}
