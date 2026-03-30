package io.bento.kafka.event;

import java.util.UUID;

public record InvitationCreatedEvent(
        String eventType,
        UUID orgId,
        String orgName,
        UUID invitedByUserId,
        String inviteeEmail,
        String role,
        String token,
        String expiresAt
) {
    public InvitationCreatedEvent(UUID orgId, String orgName, UUID invitedByUserId, String inviteeEmail,
                                  String role, String token, String expiresAt) {
        this("InvitationCreatedEvent", orgId, orgName, invitedByUserId, inviteeEmail, role, token, expiresAt);
    }
}
