package io.bento.apigateway.event;

import java.util.UUID;

/**
 * Minimal projection of org-service member events consumed by the gateway.
 * Only MEMBER_REMOVED and MEMBER_ROLE_CHANGED carry eventType — other events on
 * bento.org.events will have a null eventType and be ignored by the consumer.
 * Unknown fields from other event types are ignored by Spring Boot's default
 * Jackson config (FAIL_ON_UNKNOWN_PROPERTIES = false).
 */
public record OrgMemberStaleEvent(
        String eventType,
        UUID orgId,
        UUID userId
) {}
