package io.bento.taskservice.repository;

import io.bento.taskservice.entity.IssueRelation;
import io.bento.taskservice.enums.RelationType;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface IssueRelationRepository extends MongoRepository<IssueRelation, String> {

    List<IssueRelation> findAllByOrgIdAndSourceIssueId(String orgId, String sourceIssueId);

    List<IssueRelation> findAllByOrgIdAndTargetIssueId(String orgId, String targetIssueId);

    Optional<IssueRelation> findBySourceIssueIdAndTargetIssueIdAndRelationType(
            String sourceIssueId, String targetIssueId, RelationType relationType);

    boolean existsBySourceIssueIdAndTargetIssueIdAndRelationType(
            String sourceIssueId, String targetIssueId, RelationType relationType);

    void deleteAllByOrgIdAndSourceIssueId(String orgId, String sourceIssueId);

    void deleteAllByOrgIdAndTargetIssueId(String orgId, String targetIssueId);
}
