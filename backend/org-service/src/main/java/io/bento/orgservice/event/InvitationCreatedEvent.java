package io.bento.orgservice.event;

import io.bento.orgservice.enums.OrgRoles;

import java.time.Instant;
import java.util.UUID;

public record InvitationCreatedEvent(
        UUID orgId,
        String orgName,
        UUID invitedByUserId,
        String inviteeEmail,
        OrgRoles role,
        String token,
        Instant expiresAt
) {}

