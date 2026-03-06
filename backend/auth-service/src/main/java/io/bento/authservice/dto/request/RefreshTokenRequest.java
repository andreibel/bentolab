package io.bento.authservice.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record RefreshTokenRequest(
        @NotBlank String refreshToken,
        UUID currentOrgId   // optional — client sends the org they were in so context is preserved
) {}
