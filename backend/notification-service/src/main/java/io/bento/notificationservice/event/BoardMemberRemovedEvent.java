package io.bento.notificationservice.event;

public record BoardMemberRemovedEvent(
        String eventType,
        String boardId,
        String boardName,
        String userId
) {}
