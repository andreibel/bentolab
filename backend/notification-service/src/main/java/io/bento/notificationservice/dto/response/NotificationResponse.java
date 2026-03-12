package io.bento.notificationservice.dto.response;

import io.bento.notificationservice.enums.NotificationType;

import java.time.Instant;

public record NotificationResponse(
        String id,
        String orgId,
        String userId,
        NotificationType type,
        String title,
        String message,
        String issueId,
        String issueKey,
        String boardId,
        String sprintId,
        String triggeredBy,
        boolean isRead,
        Instant readAt,
        Instant createdAt
) {}
