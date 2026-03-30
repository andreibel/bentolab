package io.bento.authservice.dto.response;

import java.util.UUID;

public record UserProfileDto(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String avatarUrl
) {}