package io.bento.authservice.event;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserEventPublisher {
    private static final String USER_EVENTS_TOPIC = "bento.user.events";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishUserRegistered(UserRegisteredEvent event) {
        kafkaTemplate.send(USER_EVENTS_TOPIC, event.userId().toString(), event);
    }

    public void publishUserLoggedIn(UserLoggedInEvent event) {
        kafkaTemplate.send(USER_EVENTS_TOPIC, event.userId().toString(), event);
    }

    public void publishUserUpdated(UserUpdatedEvent event) {
        kafkaTemplate.send(USER_EVENTS_TOPIC, event.userId().toString(), event);
    }

    public void publishEmailVerificationRequested(EmailVerificationRequestedEvent event) {
        kafkaTemplate.send(USER_EVENTS_TOPIC, event.userId().toString(), event);
    }

    public void publishPasswordResetRequested(PasswordResetRequestedEvent event) {
        kafkaTemplate.send(USER_EVENTS_TOPIC, event.userId().toString(), event);
    }
}