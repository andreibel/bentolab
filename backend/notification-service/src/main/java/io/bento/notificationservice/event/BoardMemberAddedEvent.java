package io.bento.notificationservice.event;

public record BoardMemberAddedEvent(
        String eventType,
        String boardId,
        String boardName,
        String userId,
        String addedByUserId
) {}
