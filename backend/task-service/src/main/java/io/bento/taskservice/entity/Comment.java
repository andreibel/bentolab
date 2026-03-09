package io.bento.taskservice.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "comments")
@CompoundIndexes({
        @CompoundIndex(name = "idx_org_issue_created", def = "{'orgId': 1, 'issueId': 1, 'createdAt': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {

    @Id
    private String id;

    private String orgId;
    private String issueId;
    private String userId;
    private String text;            // markdown
    private List<String> mentionedUserIds;

    @Builder.Default
    private Boolean isEdited = false;
    @Builder.Default
    private Boolean isDeleted = false;  // soft delete

    private Instant createdAt;
    private Instant updatedAt;
}
