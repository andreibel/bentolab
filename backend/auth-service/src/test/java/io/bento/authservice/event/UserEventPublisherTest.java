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
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserEventPublisherTest {

    private static final String TOPIC = "bento.user.events";
    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock private KafkaTemplate<String, String> kafkaTemplate;
    @Mock private ObjectMapper objectMapper;
    @InjectMocks private UserEventPublisher publisher;

    @Test
    void publishUserRegistered_sendsToUserEventsTopic() throws Exception {
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        UserRegisteredEvent event = new UserRegisteredEvent(USER_ID, "a@b.com", "John", "Doe", Instant.now().toString());

        publisher.publishUserRegistered(event);

        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);
        verify(kafkaTemplate).send(topicCaptor.capture(), anyString(), anyString());
        assertThat(topicCaptor.getValue()).isEqualTo(TOPIC);
    }

    @Test
    void publishUserRegistered_usesUserIdAsKey() throws Exception {
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        UserRegisteredEvent event = new UserRegisteredEvent(USER_ID, "a@b.com", "John", "Doe", Instant.now().toString());

        publisher.publishUserRegistered(event);

        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        verify(kafkaTemplate).send(anyString(), keyCaptor.capture(), anyString());
        assertThat(keyCaptor.getValue()).isEqualTo(USER_ID.toString());
    }

    @Test
    void publishUserLoggedIn_sendsToUserEventsTopic() throws Exception {
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        UserLoggedInEvent event = new UserLoggedInEvent(USER_ID, "Chrome/Mac", Instant.now().toString());

        publisher.publishUserLoggedIn(event);

        verify(kafkaTemplate).send(eq(TOPIC), eq(USER_ID.toString()), anyString());
    }

    @Test
    void publishUserUpdated_sendsToUserEventsTopic() throws Exception {
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        UserUpdatedEvent event = new UserUpdatedEvent(USER_ID, java.util.List.of("firstName"), Instant.now().toString());

        publisher.publishUserUpdated(event);

        verify(kafkaTemplate).send(eq(TOPIC), eq(USER_ID.toString()), anyString());
    }

    @Test
    void publishEmailVerificationRequested_sendsToUserEventsTopic() throws Exception {
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        EmailVerificationRequestedEvent event =
                new EmailVerificationRequestedEvent(USER_ID, "a@b.com", "tok123", Instant.now().toString());

        publisher.publishEmailVerificationRequested(event);

        verify(kafkaTemplate).send(eq(TOPIC), eq(USER_ID.toString()), anyString());
    }

    @Test
    void publishPasswordResetRequested_sendsToUserEventsTopic() throws Exception {
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        PasswordResetRequestedEvent event =
                new PasswordResetRequestedEvent(USER_ID, "a@b.com", "tok456", Instant.now().toString());

        publisher.publishPasswordResetRequested(event);

        verify(kafkaTemplate).send(eq(TOPIC), eq(USER_ID.toString()), anyString());
    }
}
