package io.bento.boardservice.event;

import java.util.UUID;

public record BoardMemberRemovedEvent(
        String eventType,
        UUID boardId,
        String boardName,
        UUID userId
) {
    public BoardMemberRemovedEvent(UUID boardId, String boardName, UUID userId) {
        this("BoardMemberRemovedEvent", boardId, boardName, userId);
    }
}
