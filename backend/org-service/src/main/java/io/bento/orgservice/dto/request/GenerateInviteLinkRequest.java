package io.bento.orgservice.dto.request;

import io.bento.orgservice.enums.OrgRoles;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for POST /api/orgs/{orgId}/invite-link
 * Generates an open invite link (not tied to a specific email address).
 */
public record GenerateInviteLinkRequest(@NotNull OrgRoles orgRole) {}