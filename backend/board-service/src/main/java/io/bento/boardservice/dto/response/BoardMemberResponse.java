package io.bento.boardservice.dto.response;

import io.bento.boardservice.enums.BoardRole;

import java.time.Instant;
import java.util.UUID;

public record BoardMemberResponse(
        UUID id,
        UUID boardId,
        UUID userId,
        BoardRole boardRole,
        Instant joinedAt,
        UUID addedBy
) {}
