package io.bento.kafka.event;

import java.util.UUID;

public record BoardMemberRemovedEvent(
        String eventType,
        UUID boardId,
        String boardName,
        UUID orgId,
        UUID userId
) {
    public BoardMemberRemovedEvent(UUID boardId, String boardName, UUID orgId, UUID userId) {
        this("BoardMemberRemovedEvent", boardId, boardName, orgId, userId);
    }
}
