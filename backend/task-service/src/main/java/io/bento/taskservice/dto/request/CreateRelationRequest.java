package io.bento.taskservice.dto.request;

import io.bento.taskservice.enums.RelationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateRelationRequest(

        @NotBlank(message = "Target issue ID is required")
        String targetIssueId,

        @NotNull(message = "Relation type is required")
        RelationType relationType
) {}
