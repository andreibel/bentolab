package io.bento.notificationservice.controller;

import io.bento.notificationservice.dto.response.NotificationResponse;
import io.bento.notificationservice.mapper.NotificationMapper;
import io.bento.notificationservice.service.NotificationService;
import io.bento.notificationservice.service.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationMapper notificationMapper;
    private final SseEmitterRegistry sseEmitterRegistry;

    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            @RequestHeader("X-Org-Id") String orgId,
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @PageableDefault(size = 20) Pageable pageable) {

        return ResponseEntity.ok(
                notificationService.getNotifications(orgId, userId, unreadOnly, pageable)
                        .map(notificationMapper::toResponse)
        );
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @RequestHeader("X-Org-Id") String orgId,
            @AuthenticationPrincipal String userId) {

        return ResponseEntity.ok(Map.of("count", notificationService.countUnread(orgId, userId)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable String id,
            @AuthenticationPrincipal String userId) {

        notificationService.markAsRead(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @RequestHeader("X-Org-Id") String orgId,
            @AuthenticationPrincipal String userId) {

        notificationService.markAllAsRead(orgId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal String userId) {
        return sseEmitterRegistry.subscribe(userId);
    }
}
