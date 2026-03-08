package io.bento.boardservice.event;

import io.bento.boardservice.enums.BoardRole;

import java.util.UUID;

public record BoardMemberAddedEvent(
        UUID boardId,
        String boardName,
        UUID userId,
        UUID addedByUserId,
        BoardRole boardRole
) {}
