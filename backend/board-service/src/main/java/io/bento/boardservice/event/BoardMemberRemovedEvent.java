package io.bento.boardservice.event;

import java.util.UUID;

public record BoardMemberRemovedEvent(
        UUID boardId,
        String boardName,
        UUID userId
) {}
