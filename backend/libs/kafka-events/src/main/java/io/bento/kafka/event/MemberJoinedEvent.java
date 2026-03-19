package io.bento.kafka.event;

import java.util.UUID;

public record MemberJoinedEvent(
        String eventType,
        UUID orgId,
        String orgName,
        UUID newMemberId,
        String role,
        String joinedAt
) {
    public MemberJoinedEvent(UUID orgId, String orgName, UUID newMemberId, String role, String joinedAt) {
        this("MemberJoinedEvent", orgId, orgName, newMemberId, role, joinedAt);
    }
}
