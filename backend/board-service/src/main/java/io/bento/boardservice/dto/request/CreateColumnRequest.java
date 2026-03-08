package io.bento.boardservice.dto.request;

import io.bento.boardservice.entity.BoardColumn;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for {@link BoardColumn}
 */
public record CreateColumnRequest(
        @NotBlank(message = "Name cannot be blank") @Size(max = 200, message = "Name must be at most 200 characters") String name,
        @Size(min = 7, max = 7, message = "Color must be a valid hex color (#RRGGBB)") String color,
        Integer wipLimit,
        Boolean isInitial,
        Boolean isFinal) {
}