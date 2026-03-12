package io.bento.orgservice.event;

import io.bento.orgservice.enums.OrgRoles;

import java.util.UUID;

public record MemberJoinedEvent(
        String eventType,
        UUID orgId,
        String orgName,
        UUID newMemberId,
        OrgRoles role,
        String joinedAt
) {
    public MemberJoinedEvent(UUID orgId, String orgName, UUID newMemberId, OrgRoles role, String joinedAt) {
        this("MemberJoinedEvent", orgId, orgName, newMemberId, role, joinedAt);
    }
}
