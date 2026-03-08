package io.bento.boardservice.dto.request;

import io.bento.boardservice.entity.Label;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for {@link Label}
 */
public record CreateLabelRequest(
        @NotBlank(message = "Name cannot be blank") @Size(max = 100, message = "Name must be at most 100 characters") String name,
        @NotBlank(message = "Color cannot be blank") @Size(min = 7, max = 7, message = "Color must be a valid hex color (#RRGGBB)") String color,
        @Size(max = 200, message = "Description must be at most 200 characters") String description) {
}