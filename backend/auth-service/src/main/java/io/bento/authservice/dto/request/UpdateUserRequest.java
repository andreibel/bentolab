package io.bento.authservice.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Size(max = 100) String firstName,
        @Size(max = 100) String lastName,
        String avatarUrl,
        @Size(max = 10)  String locale,
        @Size(max = 100) String timezone
) {}
