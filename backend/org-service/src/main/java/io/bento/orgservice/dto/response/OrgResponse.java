package io.bento.orgservice.dto.response;

import io.bento.orgservice.enums.OrgPlan;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * DTO for {@link io.bento.orgservice.entity.Organization}
 */
public record OrgResponse(UUID id,
                          String name,
                          String slug,
                          String domain,
                          String logoUrl,
                          String description,
                          OrgPlan plan,
                          Map<String, Object> settings,
                          UUID ownerId,
                          Boolean isActive,
                          Boolean isDefault,
                          Boolean setupCompleted,
                          Instant createdAt,
                          Instant updatedAt) {
}