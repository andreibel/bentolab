package io.bento.notificationservice.repository;

import io.bento.notificationservice.entity.Notification;
import io.bento.notificationservice.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;

public interface NotificationRepository extends MongoRepository<Notification, String> {

    Page<Notification> findByOrgIdAndUserIdOrderByCreatedAtDesc(String orgId, String userId, Pageable pageable);

    Page<Notification> findByOrgIdAndUserIdAndIsReadFalseOrderByCreatedAtDesc(String orgId, String userId, Pageable pageable);

    long countByOrgIdAndUserIdAndIsReadFalse(String orgId, String userId);

    boolean existsBySprintIdAndUserIdAndTypeAndCreatedAtAfter(String sprintId, String userId, NotificationType type, Instant after);
}
