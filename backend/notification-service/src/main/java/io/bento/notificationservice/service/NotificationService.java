package io.bento.notificationservice.service;

import io.bento.notificationservice.dto.response.SprintEndingSoonDto;
import io.bento.notificationservice.entity.Notification;
import io.bento.notificationservice.enums.NotificationType;
import io.bento.kafka.event.*;
import io.bento.notificationservice.exception.NotificationNotFoundException;
import io.bento.notificationservice.mapper.NotificationMapper;
import io.bento.notificationservice.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final SseEmitterRegistry sseEmitterRegistry;

    // ── Read ─────────────────────────────────────────────────────────────────

    public Page<Notification> getNotifications(String orgId, String userId, boolean unreadOnly, Pageable pageable) {
        if (unreadOnly) {
            return notificationRepository.findByOrgIdAndUserIdAndIsReadFalseOrderByCreatedAtDesc(orgId, userId, pageable);
        }
        return notificationRepository.findByOrgIdAndUserIdOrderByCreatedAtDesc(orgId, userId, pageable);
    }

    public long countUnread(String orgId, String userId) {
        return notificationRepository.countByOrgIdAndUserIdAndIsReadFalse(orgId, userId);
    }

    // ── Mark read ─────────────────────────────────────────────────────────────

    public void markAsRead(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotificationNotFoundException(notificationId));

        if (!notification.getUserId().equals(userId)) {
            throw new NotificationNotFoundException(notificationId);
        }

        notification.setRead(true);
        notification.setReadAt(Instant.now());
        notificationRepository.save(notification);
    }

    public void markAllAsRead(String orgId, String userId) {
        Page<Notification> unread = notificationRepository
                .findByOrgIdAndUserIdAndIsReadFalseOrderByCreatedAtDesc(orgId, userId, Pageable.unpaged());

        Instant now = Instant.now();
        unread.forEach(n -> {
            n.setRead(true);
            n.setReadAt(now);
        });
        notificationRepository.saveAll(unread);
    }

    // ── Org events ────────────────────────────────────────────────────────────

    public void createMemberJoinedNotification(MemberJoinedEvent event) {
        save(Notification.builder()
                .orgId(event.orgId().toString())
                .userId(event.newMemberId().toString())
                .type(NotificationType.ORG_MEMBER_JOINED)
                .title("Welcome to " + event.orgName())
                .message("You have joined " + event.orgName() + " as " + event.role())
                .createdAt(Instant.now())
                .build());
    }

    // ── Board events ──────────────────────────────────────────────────────────

    public void createBoardMemberAddedNotification(BoardMemberAddedEvent event) {
        save(Notification.builder()
                .orgId(event.orgId().toString())
                .userId(event.userId().toString())
                .type(NotificationType.BOARD_MEMBER_ADDED)
                .title("You were added to " + event.boardName())
                .message("You now have access to board: " + event.boardName())
                .boardId(event.boardId().toString())
                .triggeredBy(event.addedByUserId().toString())
                .createdAt(Instant.now())
                .build());
    }

    public void createBoardMemberRemovedNotification(BoardMemberRemovedEvent event) {
        save(Notification.builder()
                .orgId(event.orgId().toString())
                .userId(event.userId().toString())
                .type(NotificationType.BOARD_MEMBER_REMOVED)
                .title("You were removed from " + event.boardName())
                .message("Your access to board " + event.boardName() + " has been revoked")
                .boardId(event.boardId().toString())
                .createdAt(Instant.now())
                .build());
    }

    // ── Issue events ──────────────────────────────────────────────────────────

    public void createIssueAssignedNotification(IssueAssignedEvent event) {
        save(Notification.builder()
                .orgId(event.orgId())
                .userId(event.assigneeId())
                .type(NotificationType.ISSUE_ASSIGNED)
                .title("Issue assigned to you")
                .message(event.issueKey() + ": " + event.issueTitle())
                .issueId(event.issueId())
                .issueKey(event.issueKey())
                .boardId(event.boardId())
                .triggeredBy(event.assignedByUserId())
                .createdAt(Instant.now())
                .build());
    }

    public void createIssueCommentedNotification(IssueCommentedEvent event, String recipientUserId) {
        save(Notification.builder()
                .orgId(event.orgId())
                .userId(recipientUserId)
                .type(NotificationType.ISSUE_COMMENTED)
                .title("New comment on " + event.issueKey())
                .message(event.issueTitle())
                .issueId(event.issueId())
                .issueKey(event.issueKey())
                .boardId(event.boardId())
                .triggeredBy(event.authorUserId())
                .createdAt(Instant.now())
                .build());
    }

    public void createIssueMentionedNotification(IssueCommentedEvent event, String recipientUserId) {
        save(Notification.builder()
                .orgId(event.orgId())
                .userId(recipientUserId)
                .type(NotificationType.ISSUE_MENTIONED)
                .title("You were mentioned in " + event.issueKey())
                .message(event.authorUserId() + " mentioned you in a comment on: " + event.issueTitle())
                .issueId(event.issueId())
                .issueKey(event.issueKey())
                .boardId(event.boardId())
                .triggeredBy(event.authorUserId())
                .createdAt(Instant.now())
                .build());
    }

    public void createIssueStatusChangedNotification(IssueStatusChangedEvent event, String recipientUserId) {
        save(Notification.builder()
                .orgId(event.orgId())
                .userId(recipientUserId)
                .type(NotificationType.ISSUE_STATUS_CHANGED)
                .title(event.issueKey() + " moved to " + event.toColumnName())
                .message(event.issueTitle() + " was moved from " + event.fromColumnName() + " to " + event.toColumnName())
                .issueId(event.issueId())
                .issueKey(event.issueKey())
                .boardId(event.boardId())
                .triggeredBy(event.changedByUserId())
                .createdAt(Instant.now())
                .build());
    }

    public void createIssueClosedNotification(IssueClosedEvent event, String recipientUserId) {
        save(Notification.builder()
                .orgId(event.orgId())
                .userId(recipientUserId)
                .type(NotificationType.ISSUE_CLOSED)
                .title(event.issueKey() + " was closed")
                .message(event.issueTitle() + " has been closed")
                .issueId(event.issueId())
                .issueKey(event.issueKey())
                .boardId(event.boardId())
                .triggeredBy(event.closedByUserId())
                .createdAt(Instant.now())
                .build());
    }

    public void createIssuePriorityChangedNotification(IssuePriorityChangedEvent event) {
        save(Notification.builder()
                .orgId(event.orgId())
                .userId(event.assigneeId())
                .type(NotificationType.ISSUE_PRIORITY_CHANGED)
                .title(event.issueKey() + " priority changed to " + event.newPriority())
                .message(event.issueTitle() + " priority escalated from " + event.oldPriority() + " to " + event.newPriority())
                .issueId(event.issueId())
                .issueKey(event.issueKey())
                .boardId(event.boardId())
                .triggeredBy(event.changedByUserId())
                .createdAt(Instant.now())
                .build());
    }

    // ── Sprint due soon ───────────────────────────────────────────────────────

    public void createSprintDueSoonNotification(SprintEndingSoonDto sprint, String userId) {
        save(Notification.builder()
                .orgId(sprint.orgId())
                .userId(userId)
                .type(NotificationType.SPRINT_DUE_SOON)
                .title("Sprint ending soon: " + sprint.sprintName())
                .message(sprint.sprintName() + " ends on " + sprint.endDate())
                .boardId(sprint.boardId())
                .sprintId(sprint.sprintId())
                .createdAt(Instant.now())
                .build());
    }

    // ── Sprint events ─────────────────────────────────────────────────────────

    public void createSprintStartedNotification(SprintStartedEvent event, String recipientUserId) {
        save(Notification.builder()
                .orgId(event.orgId())
                .userId(recipientUserId)
                .type(NotificationType.SPRINT_STARTED)
                .title("Sprint started: " + event.sprintName())
                .message(event.sprintName() + " has started. Ends on " + event.endDate())
                .boardId(event.boardId())
                .sprintId(event.sprintId())
                .createdAt(Instant.now())
                .build());
    }

    public void createSprintCompletedNotification(SprintCompletedEvent event, String recipientUserId) {
        save(Notification.builder()
                .orgId(event.orgId())
                .userId(recipientUserId)
                .type(NotificationType.SPRINT_COMPLETED)
                .title("Sprint completed: " + event.sprintName())
                .message(event.completedIssues() + " issues completed, " + event.remainingIssues() + " carried over")
                .boardId(event.boardId())
                .sprintId(event.sprintId())
                .createdAt(Instant.now())
                .build());
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private void save(Notification notification) {
        try {
            Notification saved = notificationRepository.save(notification);
            sseEmitterRegistry.emit(saved.getUserId(), notificationMapper.toResponse(saved));
        } catch (Exception e) {
            log.error("Failed to save notification: type={} userId={}", notification.getType(), notification.getUserId(), e);
        }
    }
}
