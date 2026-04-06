package io.bento.taskservice.dto.request;

import io.bento.taskservice.enums.MilestoneStatus;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record UpdateMilestoneRequest(

        @Size(max = 255, message = "Title must be at most 255 characters")
        String title,

        String description,

        Instant date,

        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "Color must be a valid hex color (e.g. #f59e0b)")
        String color,

        MilestoneStatus status
) {}