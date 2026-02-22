package io.bento.authservice.dto.response;

import java.util.List;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserDto user,
        List<UserOrgDto> organizations
) {}
