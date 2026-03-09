package io.bento.taskservice.service;

import io.bento.taskservice.dto.request.CreateRelationRequest;
import io.bento.taskservice.entity.IssueRelation;
import io.bento.taskservice.exception.DuplicateRelationException;
import io.bento.taskservice.exception.IssueRelationNotFoundException;
import io.bento.taskservice.repository.IssueRelationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IssueRelationService {

    private final IssueRelationRepository issueRelationRepository;

    public List<IssueRelation> getRelations(String orgId, String issueId) {
        List<IssueRelation> source = issueRelationRepository.findAllByOrgIdAndSourceIssueId(orgId, issueId);
        List<IssueRelation> target = issueRelationRepository.findAllByOrgIdAndTargetIssueId(orgId, issueId);
        source.addAll(target);
        return source;
    }

    public IssueRelation createRelation(String orgId, String userId, String sourceIssueId,
                                        CreateRelationRequest request) {
        if (issueRelationRepository.existsBySourceIssueIdAndTargetIssueIdAndRelationType(
                sourceIssueId, request.targetIssueId(), request.relationType())) {
            throw new DuplicateRelationException();
        }

        IssueRelation relation = IssueRelation.builder()
                .orgId(orgId)
                .sourceIssueId(sourceIssueId)
                .targetIssueId(request.targetIssueId())
                .relationType(request.relationType())
                .createdBy(userId)
                .createdAt(Instant.now())
                .build();

        return issueRelationRepository.save(relation);
    }

    public void deleteRelation(String orgId, String relationId) {
        IssueRelation relation = issueRelationRepository.findById(relationId)
                .filter(r -> r.getOrgId().equals(orgId))
                .orElseThrow(() -> new IssueRelationNotFoundException(relationId));

        issueRelationRepository.delete(relation);
    }
}
