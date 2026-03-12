package io.bento.taskservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CreateEpicRequest(

        @NotBlank(message = "Board ID is required")
        String boardId,

        @NotBlank(message = "Title is required")
        @Size(max = 500, message = "Title must be at most 500 characters")
        String title,

        String description,

        /** Hex color, e.g. "#6366f1". Defaults to a preset if omitted. */
        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "Color must be a valid hex color (e.g. #6366f1)")
        String color,

        Instant startDate,
        Instant endDate
) {}