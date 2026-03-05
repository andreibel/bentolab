package io.bento.orgservice.event;

import io.bento.orgservice.enums.OrgRoles;

import java.util.UUID;

public record MemberJoinedEvent(
        UUID orgId,
        String orgName,
        UUID newMemberId,
        OrgRoles role,
        String joinedAt
) {}
