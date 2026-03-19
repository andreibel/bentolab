package io.bento.notificationservice.event;

import io.bento.kafka.event.EmailVerificationRequestedEvent;
import io.bento.kafka.event.PasswordResetRequestedEvent;
import io.bento.kafka.event.UserRegisteredEvent;
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
public class UserEventConsumer {

    private final ObjectMapper kafkaObjectMapper;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @KafkaListener(topics = "bento.user.events", groupId = "notification-service")
    public void onUserEvent(String payload) {
        try {
            JsonNode node = kafkaObjectMapper.readTree(payload);
            JsonNode eventTypeNode = node.get("eventType");
            if (eventTypeNode == null) {
                log.debug("Skipping legacy event without eventType: {}", payload);
                return;
            }
            String eventType = eventTypeNode.asString();

            switch (eventType) {
                case "UserRegisteredEvent" -> {
                    UserRegisteredEvent event = kafkaObjectMapper.treeToValue(node, UserRegisteredEvent.class);
                    emailService.sendWelcomeEmail(event);
                }
                case "EmailVerificationRequestedEvent" -> {
                    EmailVerificationRequestedEvent event = kafkaObjectMapper.treeToValue(node, EmailVerificationRequestedEvent.class);
                    emailService.sendVerificationEmail(event);
                }
                case "PasswordResetRequestedEvent" -> {
                    PasswordResetRequestedEvent event = kafkaObjectMapper.treeToValue(node, PasswordResetRequestedEvent.class);
                    emailService.sendPasswordResetEmail(event);
                }
                default -> log.debug("Unhandled user event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process user event: {}", payload, e);
        }
    }
}
