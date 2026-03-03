package io.bento.orgservice.dto.response;

import io.bento.orgservice.enums.OrgRoles;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for {@link io.bento.orgservice.entity.OrganizationMember}
 */
public record MemberResponse(UUID userId, OrgRoles orgRole, UUID invitedBy, Instant joinedAt) {
}