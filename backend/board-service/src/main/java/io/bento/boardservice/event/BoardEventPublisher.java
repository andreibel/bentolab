package io.bento.boardservice.event;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BoardEventPublisher {

    private static final String BOARD_EVENTS_TOPIC = "bento.board.events";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishBoardDeleted(BoardDeletedEvent event) {
        kafkaTemplate.send(BOARD_EVENTS_TOPIC, event.boardId().toString(), event);
    }

    public void publishBoardColumnDeleted(BoardColumnDeletedEvent event) {
        kafkaTemplate.send(BOARD_EVENTS_TOPIC, event.boardId().toString(), event);
    }

    public void publishBoardMemberAdded(BoardMemberAddedEvent event) {
        kafkaTemplate.send(BOARD_EVENTS_TOPIC, event.boardId().toString(), event);
    }

    public void publishBoardMemberRemoved(BoardMemberRemovedEvent event) {
        kafkaTemplate.send(BOARD_EVENTS_TOPIC, event.boardId().toString(), event);
    }
}
