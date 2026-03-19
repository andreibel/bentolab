package io.bento.kafka.event;

import java.util.UUID;

public record MemberRoleChangedEvent(
        String eventType,
        UUID orgId,
        UUID userId,
        String newRole
) {
    public MemberRoleChangedEvent(UUID orgId, UUID userId, String newRole) {
        this("MEMBER_ROLE_CHANGED", orgId, userId, newRole);
    }
}
