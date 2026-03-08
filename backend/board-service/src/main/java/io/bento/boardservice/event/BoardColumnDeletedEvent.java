package io.bento.boardservice.event;

import java.util.UUID;

public record BoardColumnDeletedEvent(
        UUID columnId,
        UUID boardId
) {}
