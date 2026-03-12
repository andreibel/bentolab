package io.bento.notificationservice.event;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import io.bento.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SprintEventConsumer {

    private final ObjectMapper kafkaObjectMapper;
    private final NotificationService notificationService;

    @KafkaListener(topics = "bento.sprint.events", groupId = "notification-service")
    public void onSprintEvent(String payload) {
        try {
            JsonNode node = kafkaObjectMapper.readTree(payload);
            JsonNode eventTypeNode = node.get("eventType");
            if (eventTypeNode == null) {
                log.debug("Skipping legacy event without eventType: {}", payload);
                return;
            }
            String eventType = eventTypeNode.asString();

            switch (eventType) {
                case "SprintStartedEvent" -> {
                    SprintStartedEvent event = kafkaObjectMapper.treeToValue(node, SprintStartedEvent.class);
                    notificationService.createSprintStartedNotification(event);
                }
                case "SprintCompletedEvent" -> {
                    SprintCompletedEvent event = kafkaObjectMapper.treeToValue(node, SprintCompletedEvent.class);
                    notificationService.createSprintCompletedNotification(event);
                }
                default -> log.debug("Unhandled sprint event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process sprint event: {}", payload, e);
        }
    }
}
