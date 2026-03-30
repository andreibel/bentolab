package io.bento.taskservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MoveIssueRequest(

        @NotBlank(message = "Column ID is required")
        String columnId,

        @NotNull(message = "Position is required")
        @Min(value = 0, message = "Position must be non-negative")
        Integer position,

        String fromColumnName,
        String toColumnName
) {}
