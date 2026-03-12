package io.bento.taskservice.dto.request;

import io.bento.taskservice.enums.EpicStatus;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record UpdateEpicRequest(

        @Size(max = 500, message = "Title must be at most 500 characters")
        String title,

        String description,

        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "Color must be a valid hex color (e.g. #6366f1)")
        String color,

        EpicStatus status,

        Instant startDate,
        Instant endDate
) {}