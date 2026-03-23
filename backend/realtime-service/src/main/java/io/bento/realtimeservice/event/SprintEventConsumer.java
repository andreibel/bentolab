package io.bento.realtimeservice.event;

import io.bento.kafka.event.SprintCompletedEvent;
import io.bento.kafka.event.SprintStartedEvent;
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
public class SprintEventConsumer {

    private final ObjectMapper kafkaObjectMapper;
    private final SimpMessagingTemplate messaging;

    @KafkaListener(topics = "bento.sprint.events", groupId = "realtime-service")
    public void onSprintEvent(String payload) {
        try {
            JsonNode node = kafkaObjectMapper.readTree(payload);
            JsonNode typeNode = node.get("eventType");
            if (typeNode == null) return;

            switch (typeNode.asText()) {
                case "SprintStartedEvent" -> {
                    SprintStartedEvent e = kafkaObjectMapper.treeToValue(node, SprintStartedEvent.class);
                    messaging.convertAndSend("/topic/board/" + e.boardId() + "/sprints", node);
                }
                case "SprintCompletedEvent" -> {
                    SprintCompletedEvent e = kafkaObjectMapper.treeToValue(node, SprintCompletedEvent.class);
                    messaging.convertAndSend("/topic/board/" + e.boardId() + "/sprints", node);
                }
                default -> log.debug("Unhandled sprint event: {}", typeNode.asText());
            }
        } catch (Exception e) {
            log.error("Failed to process sprint event: {}", payload, e);
        }
    }
}
