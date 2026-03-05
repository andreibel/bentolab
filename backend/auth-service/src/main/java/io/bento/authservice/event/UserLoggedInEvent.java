package io.bento.authservice.event;

import java.util.UUID;

public record UserLoggedInEvent(
        UUID userId,
        String deviceInfo,
        String loggedInAt
) {}
