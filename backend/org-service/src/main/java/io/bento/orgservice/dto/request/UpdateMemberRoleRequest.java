package io.bento.orgservice.dto.request;

import io.bento.orgservice.enums.OrgRoles;

/**
 * DTO for {@link io.bento.orgservice.entity.OrganizationMember}
 */
public record UpdateMemberRoleRequest(OrgRoles orgRole) {
}