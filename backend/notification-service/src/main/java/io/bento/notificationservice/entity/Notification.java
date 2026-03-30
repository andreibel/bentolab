package io.bento.notificationservice.entity;

import io.bento.notificationservice.enums.NotificationType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "notifications")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Notification {

    @Id
    private String id;

    @Indexed
    private String orgId;

    @Indexed
    private String userId;

    private NotificationType type;
    private String title;
    private String message;

    // Context references (nullable)
    private String issueId;
    private String issueKey;
    private String boardId;
    private String sprintId;
    private String triggeredBy;

    private boolean isRead;
    private Instant readAt;

    private boolean emailSent;
    private Instant emailSentAt;
    private boolean discordSent;
    private Instant discordSentAt;

    @Indexed(expireAfterSeconds = 7776000) // 90 days TTL
    private Instant createdAt;
}
