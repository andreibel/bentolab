package io.bento.realtimeservice.controller;

import io.bento.realtimeservice.model.UserPresence;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationListener;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Controller
@RequiredArgsConstructor
public class PresenceController implements ApplicationListener<SessionDisconnectEvent> {

    private final SimpMessagingTemplate messaging;
    private final ObjectMapper objectMapper;

    // boardId → (sessionId → UserPresence)
    private final ConcurrentHashMap<String, ConcurrentHashMap<String, UserPresence>> boardPresence
            = new ConcurrentHashMap<>();

    @MessageMapping("/presence/board/{boardId}/join")
    public void join(@DestinationVariable String boardId,
                     UserPresence presence,
                     SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        if (sessionId == null) return;

        // Use the authenticated userId from the STOMP principal, not the payload
        String authenticatedUserId = headerAccessor.getUser() != null
                ? headerAccessor.getUser().getName()
                : null;
        if (authenticatedUserId == null) return;

        UserPresence trusted = new UserPresence(authenticatedUserId, presence.displayName(), presence.avatarUrl());
        boardPresence.computeIfAbsent(boardId, k -> new ConcurrentHashMap<>()).put(sessionId, trusted);
        broadcastPresence(boardId);
    }

    @MessageMapping("/presence/board/{boardId}/leave")
    public void leave(@DestinationVariable String boardId,
                      SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        if (sessionId == null) return;
        removeSession(boardId, sessionId);
        broadcastPresence(boardId);
    }

    @Override
    public void onApplicationEvent(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        // Remove this session from every board it was present in
        boardPresence.forEach((boardId, sessions) -> {
            if (sessions.remove(sessionId) != null) {
                if (sessions.isEmpty()) {
                    boardPresence.remove(boardId);
                } else {
                    broadcastPresence(boardId);
                }
            }
        });
    }

    private void removeSession(String boardId, String sessionId) {
        ConcurrentHashMap<String, UserPresence> sessions = boardPresence.get(boardId);
        if (sessions == null) return;
        sessions.remove(sessionId);
        if (sessions.isEmpty()) boardPresence.remove(boardId);
    }

    private void broadcastPresence(String boardId) {
        List<UserPresence> users = new ArrayList<>(
                boardPresence.getOrDefault(boardId, new ConcurrentHashMap<>()).values()
        );
        try {
            String json = objectMapper.writeValueAsString(users);
            messaging.convertAndSend("/topic/board/" + boardId + "/presence", json);
        } catch (Exception e) {
            log.error("Failed to broadcast presence for board {}", boardId, e);
        }
    }
}