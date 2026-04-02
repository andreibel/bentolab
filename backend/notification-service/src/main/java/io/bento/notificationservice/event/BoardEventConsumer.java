package io.bento.notificationservice.event;

import io.bento.kafka.event.BoardMemberAddedEvent;
import io.bento.kafka.event.BoardMemberRemovedEvent;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import io.bento.notificationservice.service.EmailService;
import io.bento.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BoardEventConsumer {

    private final ObjectMapper kafkaObjectMapper;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @KafkaListener(topics = "bento.board.events", groupId = "notification-service")
    public void onBoardEvent(String payload) {
        try {
            JsonNode node = kafkaObjectMapper.readTree(payload);
            JsonNode eventTypeNode = node.get("eventType");
            if (eventTypeNode == null) {
                log.debug("Skipping legacy event without eventType: {}", payload);
                return;
            }
            String eventType = eventTypeNode.asText();

            switch (eventType) {
                case "BoardMemberAddedEvent" -> {
                    BoardMemberAddedEvent e = kafkaObjectMapper.treeToValue(node, BoardMemberAddedEvent.class);
                    notificationService.createBoardMemberAddedNotification(e);
                    emailService.sendBoardMemberAdded(e);
                }
                case "BoardMemberRemovedEvent" -> {
                    BoardMemberRemovedEvent e = kafkaObjectMapper.treeToValue(node, BoardMemberRemovedEvent.class);
                    notificationService.createBoardMemberRemovedNotification(e);
                }
                default -> log.debug("Unhandled board event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process board event: {}", payload, e);
        }
    }
}
