package io.bento.notificationservice.mapper;

import io.bento.notificationservice.dto.response.NotificationResponse;
import io.bento.notificationservice.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getOrgId(),
                n.getUserId(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.getIssueId(),
                n.getIssueKey(),
                n.getBoardId(),
                n.getSprintId(),
                n.getTriggeredBy(),
                n.isRead(),
                n.getReadAt(),
                n.getCreatedAt()
        );
    }
}
