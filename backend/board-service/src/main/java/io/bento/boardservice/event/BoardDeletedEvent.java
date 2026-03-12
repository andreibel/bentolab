package io.bento.boardservice.event;

import java.util.UUID;

public record BoardDeletedEvent(
        String eventType,
        UUID boardId,
        UUID orgId
) {
    public BoardDeletedEvent(UUID boardId, UUID orgId) {
        this("BoardDeletedEvent", boardId, orgId);
    }
}
