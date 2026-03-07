package io.bento.boardservice.dto.request;

import io.bento.boardservice.entity.Board;
import io.bento.boardservice.enums.BoardType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for {@link Board}
 */
public record CreateBoardRequest(
        @NotBlank(message = "Name cannot be blank") @Size(max = 200, message = "Name must be at most 200 characters") String name,
        String description,
        @NotBlank(message = "Board key cannot be blank") @Size(max = 10, message = "Board key must be at most 10 characters") String boardKey,
        BoardType boardType,
        String background) {
}