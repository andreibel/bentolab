package io.bento.boardservice.dto.request;

import io.bento.boardservice.entity.BoardMember;
import io.bento.boardservice.enums.BoardRole;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for {@link BoardMember}
 */
public record UpdateBoardMemberRoleRequest(
        @NotNull(message = "Board role cannot be null") BoardRole boardRole) {
}