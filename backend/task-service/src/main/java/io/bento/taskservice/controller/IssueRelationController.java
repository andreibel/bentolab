package io.bento.taskservice.controller;

import io.bento.taskservice.dto.request.CreateRelationRequest;
import io.bento.taskservice.entity.IssueRelation;
import io.bento.taskservice.service.IssueRelationService;
import io.bento.taskservice.service.TaskAccessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues/{issueId}/relations")
@RequiredArgsConstructor
public class IssueRelationController {

    private final IssueRelationService issueRelationService;
    private final TaskAccessService accessService;

    @GetMapping
    public ResponseEntity<List<IssueRelation>> getRelations(
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(issueRelationService.getRelations(orgId, issueId));
    }

    // Any org member can create relations
    @PostMapping
    public ResponseEntity<IssueRelation> createRelation(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId,
            @Valid @RequestBody CreateRelationRequest request) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(issueRelationService.createRelation(orgId, userId, issueId, request));
    }

    // Any org member can remove relations
    @DeleteMapping("/{relationId}")
    public ResponseEntity<Void> deleteRelation(
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId,
            @PathVariable String relationId) {
        accessService.requireOrgMember(orgRole);
        issueRelationService.deleteRelation(orgId, relationId);
        return ResponseEntity.noContent().build();
    }
}
