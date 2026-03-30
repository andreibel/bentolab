package io.bento.realtimeservice.event;

import io.bento.kafka.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Slf4j
@Component
@RequiredArgsConstructor
public class BoardEventConsumer {

    private final ObjectMapper kafkaObjectMapper;
    private final SimpMessagingTemplate messaging;

    @KafkaListener(topics = "bento.board.events", groupId = "realtime-service")
    public void onBoardEvent(String payload) {
        try {
            JsonNode node = kafkaObjectMapper.readTree(payload);
            JsonNode typeNode = node.get("eventType");
            if (typeNode == null) return;

            switch (typeNode.asText()) {
                case "BoardDeletedEvent" -> {
                    BoardDeletedEvent e = kafkaObjectMapper.treeToValue(node, BoardDeletedEvent.class);
                    // Org board list changed — all org members need to refetch
                    messaging.convertAndSend("/topic/org/" + e.orgId() + "/boards", node);
                }
                case "BoardColumnDeletedEvent" -> {
                    BoardColumnDeletedEvent e = kafkaObjectMapper.treeToValue(node, BoardColumnDeletedEvent.class);
                    messaging.convertAndSend("/topic/board/" + e.boardId() + "/columns", node);
                }
                case "BoardMemberAddedEvent" -> {
                    BoardMemberAddedEvent e = kafkaObjectMapper.treeToValue(node, BoardMemberAddedEvent.class);
                    messaging.convertAndSend("/topic/org/" + e.orgId() + "/boards", node);
                    // Personal alert for the added user
                    messaging.convertAndSendToUser(e.userId().toString(), "/queue/notifications", node);
                }
                case "BoardMemberRemovedEvent" -> {
                    BoardMemberRemovedEvent e = kafkaObjectMapper.treeToValue(node, BoardMemberRemovedEvent.class);
                    messaging.convertAndSend("/topic/org/" + e.orgId() + "/boards", node);
                    messaging.convertAndSendToUser(e.userId().toString(), "/queue/notifications", node);
                }
                default -> log.debug("Unhandled board event: {}", typeNode.asText());
            }
        } catch (Exception e) {
            log.error("Failed to process board event: {}", payload, e);
        }
    }
}
