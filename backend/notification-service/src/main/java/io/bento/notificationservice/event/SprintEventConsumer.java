package io.bento.notificationservice.event;

import io.bento.kafka.event.SprintCompletedEvent;
import io.bento.kafka.event.SprintStartedEvent;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import io.bento.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

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
            String eventType = eventTypeNode.asText();

            switch (eventType) {
                case "SprintStartedEvent" -> {
                    SprintStartedEvent e = kafkaObjectMapper.treeToValue(node, SprintStartedEvent.class);
                    List<String> memberIds = e.memberIds() != null ? e.memberIds() : Collections.emptyList();
                    for (String memberId : memberIds) {
                        notificationService.createSprintStartedNotification(e, memberId);
                    }
                }
                case "SprintCompletedEvent" -> {
                    SprintCompletedEvent e = kafkaObjectMapper.treeToValue(node, SprintCompletedEvent.class);
                    List<String> memberIds = e.memberIds() != null ? e.memberIds() : Collections.emptyList();
                    for (String memberId : memberIds) {
                        notificationService.createSprintCompletedNotification(e, memberId);
                    }
                }
                default -> log.debug("Unhandled sprint event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process sprint event: {}", payload, e);
        }
    }
}
