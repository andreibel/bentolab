package io.bento.attacmentservice.dto.request;

import io.bento.attacmentservice.enums.EntityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record PresignRequest(
        @NotNull EntityType entityType,
        @NotBlank String entityId,
        @NotBlank String orgId,
        @NotBlank String fileName,
        @NotBlank String contentType,
        @Positive Long size
) {}
