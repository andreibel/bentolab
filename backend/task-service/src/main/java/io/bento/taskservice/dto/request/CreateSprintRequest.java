package io.bento.taskservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CreateSprintRequest(

        @NotBlank(message = "Board ID is required")
        String boardId,

        @NotBlank(message = "Sprint name is required")
        @Size(max = 200, message = "Sprint name must be at most 200 characters")
        String name,

        @Size(max = 500, message = "Goal must be at most 500 characters")
        String goal,

        @NotNull(message = "Start date is required")
        Instant startDate,

        @NotNull(message = "End date is required")
        Instant endDate,

        @Positive(message = "Duration must be positive")
        Integer duration
) {}
