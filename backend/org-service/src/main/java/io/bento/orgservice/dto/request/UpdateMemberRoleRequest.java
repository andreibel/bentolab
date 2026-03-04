package io.bento.orgservice.dto.request;

import io.bento.orgservice.enums.OrgRoles;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for {@link io.bento.orgservice.entity.OrganizationMember}
 */
public record UpdateMemberRoleRequest(@NotNull OrgRoles orgRole) {
}