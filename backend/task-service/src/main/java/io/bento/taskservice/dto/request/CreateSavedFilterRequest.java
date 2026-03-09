package io.bento.taskservice.dto.request;

import io.bento.taskservice.entity.embedded.FilterCriteria;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateSavedFilterRequest(

        @NotBlank(message = "Board ID is required")
        String boardId,

        @NotBlank(message = "Filter name is required")
        @Size(max = 100, message = "Filter name must be at most 100 characters")
        String name,

        boolean isShared,

        @NotNull(message = "Filters are required")
        FilterCriteria filters
) {}
