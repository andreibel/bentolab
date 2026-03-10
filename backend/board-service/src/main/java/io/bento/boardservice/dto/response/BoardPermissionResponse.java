package io.bento.boardservice.dto.response;

import java.util.Set;

public record BoardPermissionResponse(
        String permissionKey,
        String label,
        String description,
        boolean locked,
        Set<String> allowedRoles
) {}