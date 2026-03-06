package io.bento.orgservice.event;

import io.bento.orgservice.enums.OrgRoles;

import java.util.UUID;

public record MemberRoleChangedEvent(
        String eventType,
        UUID orgId,
        UUID userId,
        OrgRoles newRole
) {
    public MemberRoleChangedEvent(UUID orgId, UUID userId, OrgRoles newRole) {
        this("MEMBER_ROLE_CHANGED", orgId, userId, newRole);
    }
}
