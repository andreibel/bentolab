package io.bento.boardservice.mapper;

import io.bento.boardservice.dto.response.BoardColumnResponse;
import io.bento.boardservice.dto.response.BoardResponse;
import io.bento.boardservice.dto.response.BoardSummaryResponse;
import io.bento.boardservice.entity.Board;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class BoardMapper {

    public BoardResponse toResponse(Board board, List<BoardColumnResponse> columns) {
        return new BoardResponse(
                board.getId(),
                board.getOrgId(),
                board.getName(),
                board.getDescription(),
                board.getBoardKey(),
                board.getBoardType(),
                board.getBackground(),
                board.getOwnerId(),
                board.getIsArchived(),
                board.getIssueCounter(),
                columns,
                board.getCreatedAt(),
                board.getUpdatedAt()
        );
    }

    public BoardSummaryResponse toSummaryResponse(Board board) {
        return new BoardSummaryResponse(
                board.getId(),
                board.getName(),
                board.getBoardKey(),
                board.getBoardType(),
                board.getBackground(),
                board.getIsArchived(),
                board.getCreatedAt()
        );
    }
}
