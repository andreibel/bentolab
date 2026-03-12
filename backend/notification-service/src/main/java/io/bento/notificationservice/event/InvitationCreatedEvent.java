package io.bento.notificationservice.event;

import java.time.Instant;

public record InvitationCreatedEvent(
        String orgId,
        String orgName,
        String invitedByUserId,
        String inviteeEmail,
        String role,
        String token,
        Instant expiresAt
) {}
