package io.bento.authservice.event;

import io.bento.kafka.event.EmailVerificationRequestedEvent;
import io.bento.kafka.event.PasswordResetRequestedEvent;
import io.bento.kafka.event.UserLoggedInEvent;
import io.bento.kafka.event.UserRegisteredEvent;
import io.bento.kafka.event.UserUpdatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
public class UserEventPublisher {
    private static final String USER_EVENTS_TOPIC = "bento.user.events";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publishUserRegistered(UserRegisteredEvent event) {
        kafkaTemplate.send(USER_EVENTS_TOPIC, event.userId().toString(), toJson(event));
    }

    public void publishUserLoggedIn(UserLoggedInEvent event) {
        kafkaTemplate.send(USER_EVENTS_TOPIC, event.userId().toString(), toJson(event));
    }

    public void publishUserUpdated(UserUpdatedEvent event) {
        kafkaTemplate.send(USER_EVENTS_TOPIC, event.userId().toString(), toJson(event));
    }

    public void publishEmailVerificationRequested(EmailVerificationRequestedEvent event) {
        kafkaTemplate.send(USER_EVENTS_TOPIC, event.userId().toString(), toJson(event));
    }

    public void publishPasswordResetRequested(PasswordResetRequestedEvent event) {
        kafkaTemplate.send(USER_EVENTS_TOPIC, event.userId().toString(), toJson(event));
    }

    private String toJson(Object event) {
        try {
            return objectMapper.writeValueAsString(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize Kafka event", e);
        }
    }
}
