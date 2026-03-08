package io.bento.boardservice.service;

import io.bento.boardservice.dto.request.CreateColumnRequest;
import io.bento.boardservice.dto.request.ReorderColumnsRequest;
import io.bento.boardservice.dto.request.UpdateColumnRequest;
import io.bento.boardservice.dto.response.BoardColumnResponse;
import io.bento.boardservice.entity.Board;
import io.bento.boardservice.entity.BoardColumn;
import io.bento.boardservice.enums.BoardRole;
import io.bento.boardservice.event.BoardColumnDeletedEvent;
import io.bento.boardservice.event.BoardEventPublisher;
import io.bento.boardservice.exception.BoardColumnNotFoundException;
import io.bento.boardservice.exception.BoardNotFoundException;
import io.bento.boardservice.mapper.BoardColumnMapper;
import io.bento.boardservice.repository.BoardColumnRepository;
import io.bento.boardservice.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardColumnService {

    private final BoardColumnRepository boardColumnRepository;
    private final BoardRepository boardRepository;
    private final BoardColumnMapper boardColumnMapper;
    private final BoardAccessService boardAccessService;
    private final BoardEventPublisher boardEventPublisher;

    public List<BoardColumnResponse> getColumns(UUID userId, String orgRole, UUID boardId) {
        boardAccessService.requireBoardMemberOrAdmin(userId, orgRole, boardId);
        return boardColumnRepository.findAllByBoard_IdOrderByPosition(boardId).stream()
                .map(boardColumnMapper::toResponse)
                .toList();
    }

    @Transactional
    public BoardColumnResponse createColumn(UUID userId, String orgRole, UUID boardId, CreateColumnRequest request) {
        boardAccessService.requireBoardRoleOrAdmin(userId, orgRole, boardId, BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER);
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BoardNotFoundException("Board not found: " + boardId));

        int nextPosition = boardColumnRepository.findAllByBoard_IdOrderByPosition(boardId).size() + 1;

        BoardColumn column = BoardColumn.builder()
                .board(board)
                .name(request.name())
                .position(nextPosition)
                .color(request.color())
                .wipLimit(request.wipLimit())
                .isInitial(request.isInitial() != null && request.isInitial())
                .isFinal(request.isFinal() != null && request.isFinal())
                .build();

        return boardColumnMapper.toResponse(boardColumnRepository.save(column));
    }

    @Transactional
    public BoardColumnResponse updateColumn(UUID userId, String orgRole, UUID boardId, UUID columnId, UpdateColumnRequest request) {
        boardAccessService.requireBoardRoleOrAdmin(userId, orgRole, boardId, BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER);
        BoardColumn column = boardColumnRepository.findByBoard_IdAndId(boardId, columnId)
                .orElseThrow(() -> new BoardColumnNotFoundException("Column not found: " + columnId));

        if (request.name() != null && !request.name().isBlank()) column.setName(request.name());
        if (request.color() != null) column.setColor(request.color());
        if (request.wipLimit() != null) column.setWipLimit(request.wipLimit());
        if (request.isInitial() != null) column.setIsInitial(request.isInitial());
        if (request.isFinal() != null) column.setIsFinal(request.isFinal());

        return boardColumnMapper.toResponse(boardColumnRepository.save(column));
    }

    @Transactional
    public void deleteColumn(UUID userId, String orgRole, UUID boardId, UUID columnId) {
        boardAccessService.requireBoardRoleOrAdmin(userId, orgRole, boardId, BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER);
        BoardColumn column = boardColumnRepository.findByBoard_IdAndId(boardId, columnId)
                .orElseThrow(() -> new BoardColumnNotFoundException("Column not found: " + columnId));
        boardColumnRepository.delete(column);
        boardEventPublisher.publishBoardColumnDeleted(new BoardColumnDeletedEvent(columnId, boardId));
    }

    @Transactional
    public List<BoardColumnResponse> reorderColumns(UUID userId, String orgRole, UUID boardId, ReorderColumnsRequest request) {
        boardAccessService.requireBoardRoleOrAdmin(userId, orgRole, boardId, BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER);

        List<BoardColumn> columns = boardColumnRepository.findAllByBoard_IdOrderByPosition(boardId);
        List<UUID> orderedIds = request.columnIds();

        columns.forEach(col -> {
            int newPosition = orderedIds.indexOf(col.getId()) + 1;
            if (newPosition > 0) col.setPosition(newPosition);
        });

        return boardColumnRepository.saveAll(columns).stream()
                .sorted(Comparator.comparing(BoardColumn::getPosition))
                .map(boardColumnMapper::toResponse)
                .toList();
    }
}
