package io.bento.taskservice.controller;

import io.bento.taskservice.dto.request.AssignIssueRequest;
import io.bento.taskservice.dto.request.CreateIssueRequest;
import io.bento.taskservice.dto.request.MoveIssueRequest;
import io.bento.taskservice.dto.request.UpdateIssueRequest;
import io.bento.taskservice.entity.Issue;
import io.bento.taskservice.service.IssueService;
import io.bento.taskservice.service.TaskAccessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;
    private final TaskAccessService accessService;

    // Any org member can list issues
    @GetMapping
    public ResponseEntity<Page<Issue>> getIssues(
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @RequestParam String boardId,
            @RequestParam(required = false) Boolean closed,
            @PageableDefault(size = 50) Pageable pageable) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(issueService.getIssues(orgId, boardId, closed, pageable));
    }

    // Any org member can view an issue
    @GetMapping("/{issueId}")
    public ResponseEntity<Issue> getIssue(
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(issueService.getIssue(orgId, issueId));
    }

    // Any org member can create an issue
    @PostMapping
    public ResponseEntity<Issue> createIssue(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @Valid @RequestBody CreateIssueRequest request) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(issueService.createIssue(orgId, userId, request));
    }

    // Reporter, assignee, or org admin can update
    @PatchMapping("/{issueId}")
    public ResponseEntity<Issue> updateIssue(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId,
            @Valid @RequestBody UpdateIssueRequest request) {
        Issue issue = issueService.getIssue(orgId, issueId);
        // Reporter or assignee can edit; admin can always edit
        boolean isSelf = userId.equals(issue.getReporterId()) || userId.equals(issue.getAssigneeId());
        if (!isSelf && !accessService.isOrgAdmin(orgRole)) {
            accessService.requireOrgAdmin(orgRole);
        }
        return ResponseEntity.ok(issueService.updateIssue(orgId, userId, issueId, request));
    }

    // Reporter or org admin can delete
    @DeleteMapping("/{issueId}")
    public ResponseEntity<Void> deleteIssue(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId) {
        Issue issue = issueService.getIssue(orgId, issueId);
        accessService.requireSelfOrAdmin(userId, issue.getReporterId(), orgRole);
        issueService.deleteIssue(orgId, userId, issueId);
        return ResponseEntity.noContent().build();
    }

    // Any org member can move issues (drag & drop on board)
    @PatchMapping("/{issueId}/move")
    public ResponseEntity<Issue> moveIssue(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId,
            @Valid @RequestBody MoveIssueRequest request) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(issueService.moveIssue(orgId, userId, issueId, request));
    }

    // Any org member can close/reopen issues
    @PatchMapping("/{issueId}/close")
    public ResponseEntity<Issue> closeIssue(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(issueService.closeIssue(orgId, userId, issueId));
    }

    @PatchMapping("/{issueId}/reopen")
    public ResponseEntity<Issue> reopenIssue(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(issueService.reopenIssue(orgId, userId, issueId));
    }

    // Any org member can assign issues
    @PatchMapping("/{issueId}/assign")
    public ResponseEntity<Issue> assignIssue(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId,
            @RequestBody AssignIssueRequest request) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(issueService.assignIssue(orgId, userId, issueId, request));
    }
}
