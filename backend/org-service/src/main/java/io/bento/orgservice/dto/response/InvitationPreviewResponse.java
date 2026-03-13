package io.bento.orgservice.dto.response;

import io.bento.orgservice.enums.OrgRoles;

import java.time.Instant;
import java.util.UUID;

/**
 * Public invite preview — returned before the user is authenticated.
 * Exposed via GET /api/invitations/{token}/preview (public endpoint).
 */
public record InvitationPreviewResponse(
        UUID orgId,
        String orgName,
        String orgSlug,
        OrgRoles role,
        /** true = email-protected invite; false = open link anyone can accept */
        boolean isEmailProtected,
        Instant expiresAt
) {}
