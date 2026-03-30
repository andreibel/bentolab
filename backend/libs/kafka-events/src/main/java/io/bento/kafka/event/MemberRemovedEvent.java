package io.bento.kafka.event;

import java.util.UUID;

public record MemberRemovedEvent(
        String eventType,
        UUID orgId,
        UUID userId
) {
    public MemberRemovedEvent(UUID orgId, UUID userId) {
        this("MEMBER_REMOVED", orgId, userId);
    }
}
