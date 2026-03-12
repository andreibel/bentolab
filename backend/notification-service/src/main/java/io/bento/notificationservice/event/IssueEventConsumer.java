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
public class IssueEventConsumer {

    private final ObjectMapper kafkaObjectMapper;
    private final NotificationService notificationService;

    @KafkaListener(topics = "bento.issue.events", groupId = "notification-service")
    public void onIssueEvent(String payload) {
        try {
            JsonNode node = kafkaObjectMapper.readTree(payload);
            JsonNode eventTypeNode = node.get("eventType");
            if (eventTypeNode == null) {
                log.debug("Skipping legacy event without eventType: {}", payload);
                return;
            }
            String eventType = eventTypeNode.asText();

            switch (eventType) {
                case "IssueAssignedEvent" -> {
                    IssueAssignedEvent event = kafkaObjectMapper.treeToValue(node, IssueAssignedEvent.class);
                    notificationService.createIssueAssignedNotification(event);
                }
                case "IssueCommentedEvent" -> {
                    IssueCommentedEvent event = kafkaObjectMapper.treeToValue(node, IssueCommentedEvent.class);
                    notificationService.createIssueCommentedNotification(event);
                }
                default -> log.debug("Unhandled issue event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process issue event: {}", payload, e);
        }
    }
}
