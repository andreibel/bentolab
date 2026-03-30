package io.bento.orgservice.dto.response;

import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.enums.Status;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for {@link io.bento.orgservice.entity.OrgInvitation}
 * The token is included so callers can construct shareable invite URLs.
 */
public record InvitationResponse(UUID id, String email, OrgRoles orgRole, Status status, UUID invitedBy,
                                 Instant expiresAt, Instant createdAt, String token) {
}