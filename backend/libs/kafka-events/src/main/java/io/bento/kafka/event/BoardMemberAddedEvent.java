package io.bento.kafka.event;

import java.util.UUID;

public record BoardMemberAddedEvent(
        String eventType,
        UUID boardId,
        String boardName,
        UUID orgId,
        UUID userId,
        UUID addedByUserId,
        String boardRole
) {
    public BoardMemberAddedEvent(UUID boardId, String boardName, UUID orgId, UUID userId,
                                 UUID addedByUserId, String boardRole) {
        this("BoardMemberAddedEvent", boardId, boardName, orgId, userId, addedByUserId, boardRole);
    }
}
