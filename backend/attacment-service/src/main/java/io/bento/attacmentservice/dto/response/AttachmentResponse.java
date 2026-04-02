package io.bento.attacmentservice.dto.response;

import io.bento.attacmentservice.enums.AttachmentStatus;
import io.bento.attacmentservice.enums.EntityType;

import java.time.Instant;

public record AttachmentResponse(
        String id,
        EntityType entityType,
        String entityId,
        String orgId,
        String fileName,
        String contentType,
        Long size,
        AttachmentStatus status,
        String uploadedBy,
        String downloadUrl,
        Instant createdAt
) {}
