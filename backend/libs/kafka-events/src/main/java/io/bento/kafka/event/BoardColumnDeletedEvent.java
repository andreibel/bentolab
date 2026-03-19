package io.bento.kafka.event;

import java.util.UUID;

public record BoardColumnDeletedEvent(
        String eventType,
        UUID columnId,
        UUID boardId
) {
    public BoardColumnDeletedEvent(UUID columnId, UUID boardId) {
        this("BoardColumnDeletedEvent", columnId, boardId);
    }
}
