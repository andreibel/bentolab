package io.bento.notificationservice.event;

import io.bento.kafka.event.InvitationCreatedEvent;
import io.bento.kafka.event.MemberJoinedEvent;
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
public class OrgEventConsumer {

    private final ObjectMapper kafkaObjectMapper;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @KafkaListener(topics = "bento.org.events", groupId = "notification-service")
    public void onOrgEvent(String payload) {
        try {
            JsonNode node = kafkaObjectMapper.readTree(payload);
            JsonNode eventTypeNode = node.get("eventType");
            if (eventTypeNode == null) {
                log.debug("Skipping legacy event without eventType: {}", payload);
                return;
            }
            String eventType = eventTypeNode.asText();

            switch (eventType) {
                case "InvitationCreatedEvent" -> {
                    InvitationCreatedEvent event = kafkaObjectMapper.treeToValue(node, InvitationCreatedEvent.class);
                    emailService.sendInvitationEmail(event);
                }
                case "MemberJoinedEvent" -> {
                    MemberJoinedEvent event = kafkaObjectMapper.treeToValue(node, MemberJoinedEvent.class);
                    notificationService.createMemberJoinedNotification(event);
                }
                default -> log.debug("Unhandled org event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process org event: {}", payload, e);
        }
    }
}
