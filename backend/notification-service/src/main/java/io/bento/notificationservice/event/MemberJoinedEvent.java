package io.bento.notificationservice.event;

import java.time.Instant;

public record MemberJoinedEvent(
        String orgId,
        String orgName,
        String newMemberId,
        String role,
        Instant joinedAt
) {}
