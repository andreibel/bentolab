package io.bento.orgservice.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record UpdateOrgPermissionRequest(
        @NotNull Set<String> allowedRoles
) {}