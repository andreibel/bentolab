package io.bento.authservice.dto.response;

import io.bento.authservice.enums.SystemRole;

import java.time.Instant;
import java.util.UUID;

public record UserDto(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String avatarUrl,
        SystemRole systemRole,
        boolean emailVerified,
        UUID currentOrgId,
        Instant lastLoginAt,
        Instant createdAt
) {}
