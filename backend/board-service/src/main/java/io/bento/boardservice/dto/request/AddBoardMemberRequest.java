package io.bento.boardservice.dto.request;

import io.bento.boardservice.entity.BoardMember;
import io.bento.boardservice.enums.BoardRole;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * DTO for {@link BoardMember}
 */
public record AddBoardMemberRequest(
        @NotNull(message = "User ID cannot be null") UUID userId,
        @NotNull(message = "Board role cannot be null") BoardRole boardRole) {
}