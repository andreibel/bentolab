package io.bento.orgservice.event;

import io.bento.orgservice.enums.OrgRoles;

import java.util.UUID;

public record InvitationCreatedEvent(
        String eventType,
        UUID orgId,
        String orgName,
        UUID invitedByUserId,
        String inviteeEmail,
        OrgRoles role,
        String token,
        String expiresAt
) {
    public InvitationCreatedEvent(UUID orgId, String orgName, UUID invitedByUserId, String inviteeEmail, OrgRoles role, String token, String expiresAt) {
        this("InvitationCreatedEvent", orgId, orgName, invitedByUserId, inviteeEmail, role, token, expiresAt);
    }
}
