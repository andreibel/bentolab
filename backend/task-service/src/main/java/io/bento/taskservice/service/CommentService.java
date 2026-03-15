package io.bento.taskservice.service;

import io.bento.taskservice.dto.request.CreateCommentRequest;
import io.bento.taskservice.dto.request.UpdateCommentRequest;
import io.bento.taskservice.entity.Comment;
import io.bento.taskservice.entity.Issue;
import io.bento.taskservice.event.IssueCommentedEvent;
import io.bento.taskservice.event.IssueEventPublisher;
import io.bento.taskservice.exception.CommentNotFoundException;
import io.bento.taskservice.repository.CommentRepository;
import io.bento.taskservice.repository.IssueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final IssueRepository issueRepository;
    private final IssueEventPublisher issueEventPublisher;

    public Page<Comment> getComments(String orgId, String issueId, Pageable pageable) {
        return commentRepository.findAllByOrgIdAndIssueIdAndIsDeletedFalse(orgId, issueId, pageable);
    }

    public Comment getComment(String orgId, String commentId) {
        return commentRepository.findByOrgIdAndId(orgId, commentId)
                .orElseThrow(() -> new CommentNotFoundException(commentId));
    }

    public Comment createComment(String orgId, String userId, String issueId, CreateCommentRequest request) {
        Comment comment = Comment.builder()
                .orgId(orgId)
                .issueId(issueId)
                .userId(userId)
                .text(request.text())
                .mentionedUserIds(request.mentionedUserIds())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        comment = commentRepository.save(comment);

        // Increment comment count and publish event
        Issue issue = issueRepository.findByOrgIdAndId(orgId, issueId).orElse(null);
        if (issue != null) {
            issue.setCommentCount(issue.getCommentCount() + 1);
            issueRepository.save(issue);

            List<String> mentionedUserIds = request.mentionedUserIds() != null
                    ? request.mentionedUserIds() : Collections.emptyList();
            List<String> watcherIds = issue.getWatcherIds() != null
                    ? issue.getWatcherIds() : Collections.emptyList();

            issueEventPublisher.publishIssueCommented(new IssueCommentedEvent(
                    issueId, issue.getBoardId(), orgId, issue.getIssueKey(),
                    issue.getTitle(), comment.getId(), userId,
                    issue.getAssigneeId(), watcherIds, mentionedUserIds,
                    comment.getCreatedAt().toString()
            ));
        }

        return comment;
    }

    public Comment updateComment(String orgId, String commentId, UpdateCommentRequest request) {
        Comment comment = getComment(orgId, commentId);

        comment.setText(request.text());
        comment.setMentionedUserIds(request.mentionedUserIds());
        comment.setIsEdited(true);
        comment.setUpdatedAt(Instant.now());

        return commentRepository.save(comment);
    }

    public void deleteComment(String orgId, String commentId) {
        Comment comment = getComment(orgId, commentId);

        // Soft delete
        comment.setIsDeleted(true);
        comment.setUpdatedAt(Instant.now());
        commentRepository.save(comment);

        // Decrement comment count on issue
        issueRepository.findByOrgIdAndId(orgId, comment.getIssueId()).ifPresent(issue -> {
            issue.setCommentCount(Math.max(0, issue.getCommentCount() - 1));
            issueRepository.save(issue);
        });
    }
}
