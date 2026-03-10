package io.bento.boardservice.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record UpdateBoardPermissionRequest(
        @NotNull Set<String> allowedRoles
) {}