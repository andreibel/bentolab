package io.bento.boardservice.mapper;

import io.bento.boardservice.dto.response.BoardColumnResponse;
import io.bento.boardservice.entity.BoardColumn;
import org.springframework.stereotype.Component;

@Component
public class BoardColumnMapper {

    public BoardColumnResponse toResponse(BoardColumn column) {
        return new BoardColumnResponse(
                column.getId(),
                column.getBoard().getId(),
                column.getName(),
                column.getPosition(),
                column.getColor(),
                column.getWipLimit(),
                column.getIsInitial(),
                column.getIsFinal(),
                column.getCreatedAt()
        );
    }
}
