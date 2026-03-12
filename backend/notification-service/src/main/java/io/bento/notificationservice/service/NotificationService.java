package io.bento.notificationservice.service;

import io.bento.notificationservice.entity.Notification;
import io.bento.notificationservice.enums.NotificationType;
import io.bento.notificationservice.event.*;
import io.bento.notificationservice.exception.NotificationNotFoundException;
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

    // ── Create from Kafka events ──────────────────────────────────────────────

    public void createMemberJoinedNotification(MemberJoinedEvent event) {
        save(Notification.builder()
                .orgId(event.orgId())
                .userId(event.newMemberId())
                .type(NotificationType.ORG_MEMBER_JOINED)
                .title("Welcome to " + event.orgName())
                .message("You have joined " + event.orgName() + " as " + event.role())
                .createdAt(Instant.now())
                .build());
    }

    public void createIssueAssignedNotification(IssueAssignedEvent event) {
        save(Notification.builder()
                .orgId(event.orgId())
                .userId(event.assigneeUserId())
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

    public void createIssueCommentedNotification(IssueCommentedEvent event) {
        if (event.assigneeUserId() == null ||
                event.assigneeUserId().equals(event.commentAuthorUserId())) {
            return;
        }
        save(Notification.builder()
                .orgId(event.orgId())
                .userId(event.assigneeUserId())
                .type(NotificationType.ISSUE_COMMENTED)
                .title("New comment on " + event.issueKey())
                .message(event.issueTitle())
                .issueId(event.issueId())
                .issueKey(event.issueKey())
                .boardId(event.boardId())
                .triggeredBy(event.commentAuthorUserId())
                .createdAt(Instant.now())
                .build());
    }

    public void createSprintStartedNotification(SprintStartedEvent event) {
        save(Notification.builder()
                .orgId(event.orgId())
                .userId(null) // board-wide — will be fanned out to members when board membership is available
                .type(NotificationType.SPRINT_STARTED)
                .title("Sprint started: " + event.sprintName())
                .message("Sprint ends on " + event.endDate())
                .boardId(event.boardId())
                .sprintId(event.sprintId())
                .createdAt(Instant.now())
                .build());
    }

    public void createSprintCompletedNotification(SprintCompletedEvent event) {
        save(Notification.builder()
                .orgId(event.orgId())
                .userId(null)
                .type(NotificationType.SPRINT_COMPLETED)
                .title("Sprint completed: " + event.sprintName())
                .message(event.completedIssues() + " issues completed, " + event.remainingIssues() + " remaining")
                .boardId(event.boardId())
                .sprintId(event.sprintId())
                .createdAt(Instant.now())
                .build());
    }

    private void save(Notification notification) {
        try {
            notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Failed to save notification: type={} userId={}", notification.getType(), notification.getUserId(), e);
        }
    }
}
