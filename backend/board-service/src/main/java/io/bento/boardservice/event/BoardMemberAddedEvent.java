package io.bento.boardservice.event;

import io.bento.boardservice.enums.BoardRole;

import java.util.UUID;

public record BoardMemberAddedEvent(
        String eventType,
        UUID boardId,
        String boardName,
        UUID userId,
        UUID addedByUserId,
        BoardRole boardRole
) {
    public BoardMemberAddedEvent(UUID boardId, String boardName, UUID userId, UUID addedByUserId, BoardRole boardRole) {
        this("BoardMemberAddedEvent", boardId, boardName, userId, addedByUserId, boardRole);
    }
}
