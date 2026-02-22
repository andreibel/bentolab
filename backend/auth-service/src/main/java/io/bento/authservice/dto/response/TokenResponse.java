package io.bento.authservice.dto.response;

public record TokenResponse(
        String accessToken,
        String refreshToken
) {}
