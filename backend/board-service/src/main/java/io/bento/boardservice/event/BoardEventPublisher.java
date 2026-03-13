package io.bento.boardservice.event;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
public class BoardEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(BoardEventPublisher.class);
    private static final String BOARD_EVENTS_TOPIC = "bento.board.events";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publishBoardDeleted(BoardDeletedEvent event) {
        send(event.boardId().toString(), event);
    }

    public void publishBoardColumnDeleted(BoardColumnDeletedEvent event) {
        send(event.boardId().toString(), event);
    }

    public void publishBoardMemberAdded(BoardMemberAddedEvent event) {
        send(event.boardId().toString(), event);
    }

    public void publishBoardMemberRemoved(BoardMemberRemovedEvent event) {
        send(event.boardId().toString(), event);
    }

    private void send(String key, Object event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(BOARD_EVENTS_TOPIC, key, payload);
        } catch (Exception e) {
            log.error("Failed to publish event {}: {}", event.getClass().getSimpleName(), e.getMessage(), e);
        }
    }
}
