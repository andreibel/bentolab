package io.bento.boardservice.dto.request;

import io.bento.boardservice.entity.Board;
import jakarta.validation.constraints.Size;

/**
 * DTO for {@link Board}
 */
public record UpdateBoardRequest(
        @Size(max = 200, message = "Name must be at most 200 characters") String name,
        String description,
        String background) {
}