package io.bento.boardservice.service;

import io.bento.boardservice.dto.request.CreateBoardRequest;
import io.bento.boardservice.dto.request.UpdateBoardRequest;
import io.bento.boardservice.dto.response.BoardColumnResponse;
import io.bento.boardservice.dto.response.BoardResponse;
import io.bento.boardservice.dto.response.BoardSummaryResponse;
import io.bento.boardservice.entity.Board;
import io.bento.boardservice.entity.BoardColumn;
import io.bento.boardservice.entity.BoardMember;
import io.bento.boardservice.enums.BoardRole;
import io.bento.boardservice.enums.BoardType;
import io.bento.boardservice.exception.BoardAccessDeniedException;
import io.bento.boardservice.exception.BoardKeyAlreadyExistsException;
import io.bento.boardservice.exception.BoardNotFoundException;
import io.bento.boardservice.mapper.BoardColumnMapper;
import io.bento.boardservice.mapper.BoardMapper;
import io.bento.boardservice.repository.BoardColumnRepository;
import io.bento.boardservice.repository.BoardMemberRepository;
import io.bento.boardservice.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardService {

    private final BoardRepository boardRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final BoardMapper boardMapper;
    private final BoardColumnMapper boardColumnMapper;
    private final BoardAccessService boardAccessService;

    public List<BoardSummaryResponse> getBoards(UUID userId, UUID orgId, String orgRole) {
        List<Board> boards = boardRepository.findAllByOrgId(orgId);

        // ORG_ADMIN+ sees all boards in the org
        if (boardAccessService.isOrgAdmin(orgRole)) {
            return boards.stream().map(boardMapper::toSummaryResponse).toList();
        }

        // ORG_MEMBER sees only boards they are a member of
        List<UUID> memberBoardIds = boardMemberRepository.findAllByUserId(userId).stream()
                .map(m -> m.getBoard().getId())
                .toList();
        return boards.stream()
                .filter(b -> memberBoardIds.contains(b.getId()))
                .map(boardMapper::toSummaryResponse)
                .toList();
    }

    @Transactional
    public BoardResponse createBoard(UUID userId, UUID orgId, String orgRole, CreateBoardRequest request) {
        if (!boardAccessService.isOrgAdmin(orgRole)) {
            throw new BoardAccessDeniedException("Only org admins can create boards");
        }
        if (boardRepository.existsByOrgIdAndBoardKey(orgId, request.boardKey())) {
            throw new BoardKeyAlreadyExistsException("Board key already exists: " + request.boardKey());
        }

        BoardType type = request.boardType() != null ? request.boardType() : BoardType.SCRUM;

        Board board = Board.builder()
                .orgId(orgId)
                .name(request.name())
                .description(request.description())
                .boardKey(request.boardKey())
                .boardType(type)
                .background(request.background())
                .ownerId(userId)
                .build();
        board = boardRepository.save(board);

        List<BoardColumn> defaultColumns = buildDefaultColumns(board, type);
        boardColumnRepository.saveAll(defaultColumns);

        BoardMember owner = BoardMember.builder()
                .board(board)
                .userId(userId)
                .boardRole(BoardRole.PRODUCT_OWNER)
                .addedBy(userId)
                .build();
        boardMemberRepository.save(owner);

        List<BoardColumnResponse> columnResponses = defaultColumns.stream()
                .map(boardColumnMapper::toResponse)
                .toList();
        return boardMapper.toResponse(board, columnResponses);
    }

    public BoardResponse getBoard(UUID userId, String orgRole, UUID boardId) {
        boardAccessService.requireBoardMemberOrAdmin(userId, orgRole, boardId);
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BoardNotFoundException("Board not found: " + boardId));
        List<BoardColumnResponse> columns = boardColumnRepository.findAllByBoard_IdOrderByPosition(boardId).stream()
                .map(boardColumnMapper::toResponse)
                .toList();
        return boardMapper.toResponse(board, columns);
    }

    @Transactional
    public BoardResponse updateBoard(UUID userId, String orgRole, UUID boardId, UpdateBoardRequest request) {
        boardAccessService.requireBoardRoleOrAdmin(userId, orgRole, boardId, BoardRole.PRODUCT_OWNER);
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BoardNotFoundException("Board not found: " + boardId));

        if (request.name() != null && !request.name().isBlank()) board.setName(request.name());
        if (request.description() != null) board.setDescription(request.description());
        if (request.background() != null) board.setBackground(request.background());

        board = boardRepository.save(board);
        List<BoardColumnResponse> columns = boardColumnRepository.findAllByBoard_IdOrderByPosition(boardId).stream()
                .map(boardColumnMapper::toResponse)
                .toList();
        return boardMapper.toResponse(board, columns);
    }

    @Transactional
    public void deleteBoard(UUID userId, String orgRole, UUID boardId) {
        boardAccessService.requireBoardOwnerOrOrgOwner(userId, orgRole, boardId);
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BoardNotFoundException("Board not found: " + boardId));
        boardRepository.delete(board);
    }

    @Transactional
    public BoardResponse toggleArchive(UUID userId, String orgRole, UUID boardId) {
        boardAccessService.requireBoardRoleOrAdmin(userId, orgRole, boardId, BoardRole.PRODUCT_OWNER);
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BoardNotFoundException("Board not found: " + boardId));
        board.setIsArchived(!board.getIsArchived());
        board = boardRepository.save(board);
        List<BoardColumnResponse> columns = boardColumnRepository.findAllByBoard_IdOrderByPosition(boardId).stream()
                .map(boardColumnMapper::toResponse)
                .toList();
        return boardMapper.toResponse(board, columns);
    }

    private List<BoardColumn> buildDefaultColumns(Board board, BoardType type) {
        return switch (type) {
            case SCRUM -> List.of(
                    buildColumn(board, "To Do", 1, true, false),
                    buildColumn(board, "In Progress", 2, false, false),
                    buildColumn(board, "In Review", 3, false, false),
                    buildColumn(board, "Done", 4, false, true)
            );
            case KANBAN -> List.of(
                    buildColumn(board, "Backlog", 1, true, false),
                    buildColumn(board, "In Progress", 2, false, false),
                    buildColumn(board, "Done", 3, false, true)
            );
            case BUG_TRACKING -> List.of(
                    buildColumn(board, "Open", 1, true, false),
                    buildColumn(board, "In Progress", 2, false, false),
                    buildColumn(board, "In Review", 3, false, false),
                    buildColumn(board, "Resolved", 4, false, true)
            );
            case CUSTOM -> List.of(
                    buildColumn(board, "To Do", 1, true, false),
                    buildColumn(board, "Done", 2, false, true)
            );
        };
    }

    private BoardColumn buildColumn(Board board, String name, int position, boolean isInitial, boolean isFinal) {
        return BoardColumn.builder()
                .board(board)
                .name(name)
                .position(position)
                .isInitial(isInitial)
                .isFinal(isFinal)
                .build();
    }
}
