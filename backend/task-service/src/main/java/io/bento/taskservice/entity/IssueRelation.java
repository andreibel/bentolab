package io.bento.taskservice.entity;

import io.bento.taskservice.enums.RelationType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "issue_relations")
@CompoundIndexes({
        @CompoundIndex(name = "idx_org_source", def = "{'orgId': 1, 'sourceIssueId': 1}"),
        @CompoundIndex(name = "idx_org_target", def = "{'orgId': 1, 'targetIssueId': 1}"),
        @CompoundIndex(name = "idx_unique_relation", def = "{'sourceIssueId': 1, 'targetIssueId': 1, 'relationType': 1}", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueRelation {

    @Id
    private String id;

    private String orgId;
    private String sourceIssueId;
    private String targetIssueId;
    private RelationType relationType;
    private String createdBy;
    private Instant createdAt;
}
