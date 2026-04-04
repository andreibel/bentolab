package io.bento.authservice.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SwitchOrgBySlugRequest(
        @NotBlank String refreshToken,
        @NotBlank String orgSlug
) {}
