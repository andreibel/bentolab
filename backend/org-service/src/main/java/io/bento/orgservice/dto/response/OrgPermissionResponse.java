package io.bento.orgservice.dto.response;

import java.util.Set;

public record OrgPermissionResponse(
        String permissionKey,
        String label,
        String description,
        boolean locked,
        Set<String> allowedRoles
) {}