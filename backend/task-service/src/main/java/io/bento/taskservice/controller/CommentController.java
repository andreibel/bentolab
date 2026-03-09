package io.bento.taskservice.controller;

import io.bento.taskservice.dto.request.CreateCommentRequest;
import io.bento.taskservice.dto.request.UpdateCommentRequest;
import io.bento.taskservice.entity.Comment;
import io.bento.taskservice.service.CommentService;
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
@RequestMapping("/api/issues/{issueId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final TaskAccessService accessService;

    @GetMapping
    public ResponseEntity<Page<Comment>> getComments(
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId,
            @PageableDefault(size = 20) Pageable pageable) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.ok(commentService.getComments(orgId, issueId, pageable));
    }

    // Any org member can comment
    @PostMapping
    public ResponseEntity<Comment> createComment(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId,
            @Valid @RequestBody CreateCommentRequest request) {
        accessService.requireOrgMember(orgRole);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.createComment(orgId, userId, issueId, request));
    }

    // Only comment author or admin can edit
    @PatchMapping("/{commentId}")
    public ResponseEntity<Comment> updateComment(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId,
            @PathVariable String commentId,
            @Valid @RequestBody UpdateCommentRequest request) {
        Comment comment = commentService.getComment(orgId, commentId);
        accessService.requireSelfOrAdmin(userId, comment.getUserId(), orgRole);
        return ResponseEntity.ok(commentService.updateComment(orgId, commentId, request));
    }

    // Only comment author or admin can delete
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-Org-Role") String orgRole,
            @PathVariable String issueId,
            @PathVariable String commentId) {
        Comment comment = commentService.getComment(orgId, commentId);
        accessService.requireSelfOrAdmin(userId, comment.getUserId(), orgRole);
        commentService.deleteComment(orgId, commentId);
        return ResponseEntity.noContent().build();
    }
}
