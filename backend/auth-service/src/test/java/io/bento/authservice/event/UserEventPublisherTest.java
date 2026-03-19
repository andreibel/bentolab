package io.bento.authservice.event;

import io.bento.kafka.event.EmailVerificationRequestedEvent;
import io.bento.kafka.event.PasswordResetRequestedEvent;
import io.bento.kafka.event.UserLoggedInEvent;
import io.bento.kafka.event.UserRegisteredEvent;
import io.bento.kafka.event.UserUpdatedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UserEventPublisherTest {

    private static final String TOPIC = "bento.user.events";
    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;
    @InjectMocks
    private UserEventPublisher publisher;

    @Test
    void publishUserRegistered_sendsToUserEventsTopic() {
        UserRegisteredEvent event = new UserRegisteredEvent(USER_ID, "a@b.com", "John", "Doe", Instant.now().toString());

        publisher.publishUserRegistered(event);

        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);
        verify(kafkaTemplate).send(topicCaptor.capture(), org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any());
        assertThat(topicCaptor.getValue()).isEqualTo(TOPIC);
    }

    @Test
    void publishUserRegistered_usesUserIdAsKey() {
        UserRegisteredEvent event = new UserRegisteredEvent(USER_ID, "a@b.com", "John", "Doe", Instant.now().toString());

        publisher.publishUserRegistered(event);

        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        verify(kafkaTemplate).send(org.mockito.ArgumentMatchers.anyString(), keyCaptor.capture(), org.mockito.ArgumentMatchers.any());
        assertThat(keyCaptor.getValue()).isEqualTo(USER_ID.toString());
    }

    @Test
    void publishUserLoggedIn_sendsToUserEventsTopic() {
        UserLoggedInEvent event = new UserLoggedInEvent(USER_ID, "Chrome/Mac", Instant.now().toString());

        publisher.publishUserLoggedIn(event);

        verify(kafkaTemplate).send(TOPIC, USER_ID.toString(), event);
    }

    @Test
    void publishUserUpdated_sendsToUserEventsTopic() {
        UserUpdatedEvent event = new UserUpdatedEvent(USER_ID, java.util.List.of("firstName"), Instant.now().toString());

        publisher.publishUserUpdated(event);

        verify(kafkaTemplate).send(TOPIC, USER_ID.toString(), event);
    }

    @Test
    void publishEmailVerificationRequested_sendsToUserEventsTopic() {
        EmailVerificationRequestedEvent event =
                new EmailVerificationRequestedEvent(USER_ID, "a@b.com", "tok123", Instant.now().toString());

        publisher.publishEmailVerificationRequested(event);

        verify(kafkaTemplate).send(TOPIC, USER_ID.toString(), event);
    }

    @Test
    void publishPasswordResetRequested_sendsToUserEventsTopic() {
        PasswordResetRequestedEvent event =
                new PasswordResetRequestedEvent(USER_ID, "a@b.com", "tok456", Instant.now().toString());

        publisher.publishPasswordResetRequested(event);

        verify(kafkaTemplate).send(TOPIC, USER_ID.toString(), event);
    }
}
