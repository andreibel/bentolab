package io.bento.orgservice.dto.response;

import io.bento.orgservice.enums.OrgRoles;

import java.time.Instant;
import java.util.UUID;

/**
 * Returned after successfully accepting an invitation.
 * Includes org context so the frontend can immediately switch into the new org.
 */
public record AcceptInvitationResponse(
        UUID userId,
        OrgRoles orgRole,
        Instant joinedAt,
        UUID orgId,
        String orgSlug,
        String orgName
) {}
