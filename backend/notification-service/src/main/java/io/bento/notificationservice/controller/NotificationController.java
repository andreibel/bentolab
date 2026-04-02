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
import java.util.UUID;

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
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @PageableDefault(size = 20) Pageable pageable) {

        return ResponseEntity.ok(
                notificationService.getNotifications(orgId, userId.toString(), unreadOnly, pageable)
                        .map(notificationMapper::toResponse)
        );
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @RequestHeader("X-Org-Id") String orgId,
            @AuthenticationPrincipal UUID userId) {

        return ResponseEntity.ok(Map.of("count", notificationService.countUnread(orgId, userId.toString())));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable String id,
            @AuthenticationPrincipal UUID userId) {

        notificationService.markAsRead(id, userId.toString());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @RequestHeader("X-Org-Id") String orgId,
            @AuthenticationPrincipal UUID userId) {

        notificationService.markAllAsRead(orgId, userId.toString());
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal UUID userId) {
        return sseEmitterRegistry.subscribe(userId.toString());
    }
}
