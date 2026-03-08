package io.bento.boardservice.event;

import java.util.UUID;

public record BoardDeletedEvent(
        UUID boardId,
        UUID orgId
) {}
