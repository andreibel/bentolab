package io.bento.boardservice.mapper;

import io.bento.boardservice.dto.response.BoardMemberResponse;
import io.bento.boardservice.entity.BoardMember;
import org.springframework.stereotype.Component;

@Component
public class BoardMemberMapper {

    public BoardMemberResponse toResponse(BoardMember member) {
        return new BoardMemberResponse(
                member.getId(),
                member.getBoard().getId(),
                member.getUserId(),
                member.getBoardRole(),
                member.getJoinedAt(),
                member.getAddedBy()
        );
    }
}
