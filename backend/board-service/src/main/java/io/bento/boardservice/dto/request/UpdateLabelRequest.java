package io.bento.boardservice.dto.request;

import io.bento.boardservice.entity.Label;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for {@link Label}
 */
public record UpdateLabelRequest(
        @Size(max = 100, message = "Name must be at most 100 characters") String name,
        @Size(min = 7, max = 7, message = "Color must be a valid hex color (#RRGGBB)") String color,
        @Size(max = 200, message = "Description must be at most 200 characters") String description) {
}