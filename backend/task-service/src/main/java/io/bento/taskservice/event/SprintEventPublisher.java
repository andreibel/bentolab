package io.bento.taskservice.event;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
public class SprintEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(SprintEventPublisher.class);
    private static final String SPRINT_EVENTS_TOPIC = "bento.sprint.events";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publishSprintStarted(SprintStartedEvent event) {
        send(event.sprintId(), event);
    }

    public void publishSprintCompleted(SprintCompletedEvent event) {
        send(event.sprintId(), event);
    }

    private void send(String key, Object event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(SPRINT_EVENTS_TOPIC, key, payload);
        } catch (Exception e) {
            log.warn("Failed to publish event {}: {}", event.getClass().getSimpleName(), e.getMessage());
        }
    }
}
