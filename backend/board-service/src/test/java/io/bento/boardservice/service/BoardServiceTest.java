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
import io.bento.boardservice.event.BoardEventPublisher;
import io.bento.boardservice.exception.BoardAccessDeniedException;
import io.bento.boardservice.exception.BoardKeyAlreadyExistsException;
import io.bento.boardservice.exception.BoardNotFoundException;
import io.bento.boardservice.mapper.BoardColumnMapper;
import io.bento.boardservice.mapper.BoardMapper;
import io.bento.boardservice.repository.BoardColumnRepository;
import io.bento.boardservice.repository.BoardMemberRepository;
import io.bento.boardservice.repository.BoardRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BoardServiceTest {

    @Mock private BoardRepository boardRepository;
    @Mock private BoardColumnRepository boardColumnRepository;
    @Mock private BoardMemberRepository boardMemberRepository;
    @Mock private BoardMapper boardMapper;
    @Mock private BoardColumnMapper boardColumnMapper;
    @Mock private BoardAccessService boardAccessService;
    @Mock private BoardEventPublisher boardEventPublisher;
    @Mock private BoardPermissionService boardPermissionService;

    @InjectMocks private BoardService boardService;

    private static final UUID USER_ID  = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID ORG_ID   = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID BOARD_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");

    private Board buildBoard() {
        return Board.builder()
                .id(BOARD_ID)
                .orgId(ORG_ID)
                .name("Sprint Board")
                .boardKey("SB")
                .boardType(BoardType.SCRUM)
                .ownerId(USER_ID)
                .isArchived(false)
                .issueCounter(0)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    private BoardSummaryResponse buildSummaryResponse(UUID id) {
        return new BoardSummaryResponse(id, "Sprint Board", "SB", BoardType.SCRUM, null, false, Instant.now());
    }

    private BoardResponse buildBoardResponse() {
        return new BoardResponse(BOARD_ID, ORG_ID, "Sprint Board", null, "SB",
                BoardType.SCRUM, null, USER_ID, false, 0, List.of(), Instant.now(), Instant.now());
    }

    // =========================================================================
    // getBoards
    // =========================================================================

    @Test
    void getBoards_orgAdmin_returnsAllOrgBoards() {
        Board board1 = buildBoard();
        Board board2 = Board.builder().id(UUID.randomUUID()).orgId(ORG_ID).name("Kanban")
                .boardKey("KB").boardType(BoardType.KANBAN).ownerId(USER_ID).build();
        BoardSummaryResponse r1 = buildSummaryResponse(board1.getId());
        BoardSummaryResponse r2 = buildSummaryResponse(board2.getId());

        when(boardRepository.findAllByOrgId(ORG_ID)).thenReturn(List.of(board1, board2));
        when(boardAccessService.isOrgAdmin("ORG_ADMIN")).thenReturn(true);
        when(boardMapper.toSummaryResponse(board1)).thenReturn(r1);
        when(boardMapper.toSummaryResponse(board2)).thenReturn(r2);

        List<BoardSummaryResponse> result = boardService.getBoards(USER_ID, ORG_ID, "ORG_ADMIN");

        assertThat(result).containsExactlyInAnyOrder(r1, r2);
        verifyNoInteractions(boardMemberRepository);
    }

    @Test
    void getBoards_orgMember_returnsOnlyMemberBoards() {
        Board memberBoard = buildBoard();
        UUID otherBoardId = UUID.randomUUID();
        Board otherBoard = Board.builder().id(otherBoardId).orgId(ORG_ID).name("Other")
                .boardKey("OB").boardType(BoardType.KANBAN).ownerId(UUID.randomUUID()).build();

        BoardMember membership = BoardMember.builder()
                .board(memberBoard).userId(USER_ID).boardRole(BoardRole.DEVELOPER)
                .addedBy(UUID.randomUUID()).build();
        BoardSummaryResponse response = buildSummaryResponse(BOARD_ID);

        when(boardRepository.findAllByOrgId(ORG_ID)).thenReturn(List.of(memberBoard, otherBoard));
        when(boardAccessService.isOrgAdmin("ORG_MEMBER")).thenReturn(false);
        when(boardMemberRepository.findAllByUserId(USER_ID)).thenReturn(List.of(membership));
        when(boardMapper.toSummaryResponse(memberBoard)).thenReturn(response);

        List<BoardSummaryResponse> result = boardService.getBoards(USER_ID, ORG_ID, "ORG_MEMBER");

        assertThat(result).containsExactly(response);
    }

    @Test
    void getBoards_orgMemberNoBoards_returnsEmptyList() {
        when(boardRepository.findAllByOrgId(ORG_ID)).thenReturn(List.of(buildBoard()));
        when(boardAccessService.isOrgAdmin("ORG_MEMBER")).thenReturn(false);
        when(boardMemberRepository.findAllByUserId(USER_ID)).thenReturn(List.of());

        assertThat(boardService.getBoards(USER_ID, ORG_ID, "ORG_MEMBER")).isEmpty();
    }

    // =========================================================================
    // createBoard
    // =========================================================================

    @Test
    void createBoard_orgAdmin_savesBoard_andScrumDefaultColumns() {
        Board saved = buildBoard();
        BoardResponse response = buildBoardResponse();

        when(boardAccessService.isOrgAdmin("ORG_ADMIN")).thenReturn(true);
        when(boardRepository.existsByOrgIdAndBoardKey(ORG_ID, "SB")).thenReturn(false);
        when(boardRepository.save(any())).thenReturn(saved);
        when(boardColumnRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
        when(boardMemberRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(boardColumnMapper.toResponse(any())).thenReturn(
                new BoardColumnResponse(UUID.randomUUID(), BOARD_ID, "To Do", 1, null, null, true, false, Instant.now()));
        when(boardMapper.toResponse(eq(saved), any())).thenReturn(response);

        BoardResponse result = boardService.createBoard(USER_ID, ORG_ID, "ORG_ADMIN",
                new CreateBoardRequest("Sprint Board", null, "SB", BoardType.SCRUM, null));

        assertThat(result).isEqualTo(response);
        verify(boardRepository).save(any());
        // SCRUM has 4 default columns
        ArgumentCaptor<List<BoardColumn>> colCaptor = ArgumentCaptor.forClass(List.class);
        verify(boardColumnRepository).saveAll(colCaptor.capture());
        assertThat(colCaptor.getValue()).hasSize(4);
    }

    @Test
    void createBoard_addsCallerAsProductOwner() {
        Board saved = buildBoard();
        when(boardAccessService.isOrgAdmin("ORG_ADMIN")).thenReturn(true);
        when(boardRepository.existsByOrgIdAndBoardKey(ORG_ID, "SB")).thenReturn(false);
        when(boardRepository.save(any())).thenReturn(saved);
        when(boardColumnRepository.saveAll(any())).thenReturn(List.of());
        when(boardMemberRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(boardColumnMapper.toResponse(any())).thenReturn(
                new BoardColumnResponse(UUID.randomUUID(), BOARD_ID, "c", 1, null, null, false, false, Instant.now()));
        when(boardMapper.toResponse(any(), any())).thenReturn(buildBoardResponse());

        boardService.createBoard(USER_ID, ORG_ID, "ORG_ADMIN",
                new CreateBoardRequest("Sprint Board", null, "SB", BoardType.SCRUM, null));

        ArgumentCaptor<BoardMember> memberCaptor = ArgumentCaptor.forClass(BoardMember.class);
        verify(boardMemberRepository).save(memberCaptor.capture());
        assertThat(memberCaptor.getValue().getUserId()).isEqualTo(USER_ID);
        assertThat(memberCaptor.getValue().getBoardRole()).isEqualTo(BoardRole.PRODUCT_OWNER);
    }

    @Test
    void createBoard_initializesPermissions() {
        Board saved = buildBoard();
        when(boardAccessService.isOrgAdmin("ORG_ADMIN")).thenReturn(true);
        when(boardRepository.existsByOrgIdAndBoardKey(ORG_ID, "SB")).thenReturn(false);
        when(boardRepository.save(any())).thenReturn(saved);
        when(boardColumnRepository.saveAll(any())).thenReturn(List.of());
        when(boardMemberRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(boardColumnMapper.toResponse(any())).thenReturn(
                new BoardColumnResponse(UUID.randomUUID(), BOARD_ID, "c", 1, null, null, false, false, Instant.now()));
        when(boardMapper.toResponse(any(), any())).thenReturn(buildBoardResponse());

        boardService.createBoard(USER_ID, ORG_ID, "ORG_ADMIN",
                new CreateBoardRequest("Sprint Board", null, "SB", null, null));

        verify(boardPermissionService).initializeDefaults(saved.getId());
    }

    @Test
    void createBoard_kanbanType_creates3DefaultColumns() {
        Board saved = Board.builder().id(BOARD_ID).orgId(ORG_ID).name("K").boardKey("KB")
                .boardType(BoardType.KANBAN).ownerId(USER_ID).build();

        when(boardAccessService.isOrgAdmin("ORG_ADMIN")).thenReturn(true);
        when(boardRepository.existsByOrgIdAndBoardKey(ORG_ID, "KB")).thenReturn(false);
        when(boardRepository.save(any())).thenReturn(saved);
        when(boardColumnRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
        when(boardMemberRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(boardColumnMapper.toResponse(any())).thenReturn(
                new BoardColumnResponse(UUID.randomUUID(), BOARD_ID, "c", 1, null, null, false, false, Instant.now()));
        when(boardMapper.toResponse(any(), any())).thenReturn(buildBoardResponse());

        boardService.createBoard(USER_ID, ORG_ID, "ORG_ADMIN",
                new CreateBoardRequest("Kanban Board", null, "KB", BoardType.KANBAN, null));

        ArgumentCaptor<List<BoardColumn>> captor = ArgumentCaptor.forClass(List.class);
        verify(boardColumnRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(3);
    }

    @Test
    void createBoard_notOrgAdmin_throwsAccessDenied() {
        when(boardAccessService.isOrgAdmin("ORG_MEMBER")).thenReturn(false);

        assertThatThrownBy(() ->
                boardService.createBoard(USER_ID, ORG_ID, "ORG_MEMBER",
                        new CreateBoardRequest("Board", null, "SB", null, null)))
                .isInstanceOf(BoardAccessDeniedException.class);

        verify(boardRepository, never()).save(any());
    }

    @Test
    void createBoard_duplicateBoardKey_throwsBoardKeyAlreadyExists() {
        when(boardAccessService.isOrgAdmin("ORG_ADMIN")).thenReturn(true);
        when(boardRepository.existsByOrgIdAndBoardKey(ORG_ID, "SB")).thenReturn(true);

        assertThatThrownBy(() ->
                boardService.createBoard(USER_ID, ORG_ID, "ORG_ADMIN",
                        new CreateBoardRequest("Board", null, "SB", null, null)))
                .isInstanceOf(BoardKeyAlreadyExistsException.class);

        verify(boardRepository, never()).save(any());
    }

    // =========================================================================
    // getBoard
    // =========================================================================

    @Test
    void getBoard_validAccess_returnsBoardWithColumns() {
        Board board = buildBoard();
        BoardColumnResponse colResponse = new BoardColumnResponse(
                UUID.randomUUID(), BOARD_ID, "To Do", 1, null, null, true, false, Instant.now());
        BoardResponse response = buildBoardResponse();

        when(boardRepository.findById(BOARD_ID)).thenReturn(Optional.of(board));
        when(boardColumnRepository.findAllByBoard_IdOrderByPosition(BOARD_ID))
                .thenReturn(List.of(buildColumn("To Do", 1)));
        when(boardColumnMapper.toResponse(any())).thenReturn(colResponse);
        when(boardMapper.toResponse(eq(board), any())).thenReturn(response);

        BoardResponse result = boardService.getBoard(USER_ID, "ORG_MEMBER", BOARD_ID);

        assertThat(result).isEqualTo(response);
        verify(boardAccessService).requireBoardMemberOrAdmin(USER_ID, "ORG_MEMBER", BOARD_ID);
    }

    @Test
    void getBoard_boardNotFound_throwsBoardNotFoundException() {
        when(boardRepository.findById(BOARD_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> boardService.getBoard(USER_ID, "ORG_ADMIN", BOARD_ID))
                .isInstanceOf(BoardNotFoundException.class);
    }

    // =========================================================================
    // updateBoard
    // =========================================================================

    @Test
    void updateBoard_productOwner_updatesFields() {
        Board board = buildBoard();
        when(boardRepository.findById(BOARD_ID)).thenReturn(Optional.of(board));
        when(boardRepository.save(board)).thenReturn(board);
        when(boardColumnRepository.findAllByBoard_IdOrderByPosition(BOARD_ID)).thenReturn(List.of());
        when(boardMapper.toResponse(eq(board), any())).thenReturn(buildBoardResponse());

        boardService.updateBoard(USER_ID, "ORG_MEMBER", BOARD_ID,
                new UpdateBoardRequest("New Name", "A description", "#BG"));

        assertThat(board.getName()).isEqualTo("New Name");
        assertThat(board.getDescription()).isEqualTo("A description");
        assertThat(board.getBackground()).isEqualTo("#BG");
        verify(boardAccessService).requireBoardRoleOrAdmin(USER_ID, "ORG_MEMBER", BOARD_ID, BoardRole.PRODUCT_OWNER);
    }

    @Test
    void updateBoard_nullName_doesNotOverwriteExistingName() {
        Board board = buildBoard();
        when(boardRepository.findById(BOARD_ID)).thenReturn(Optional.of(board));
        when(boardRepository.save(board)).thenReturn(board);
        when(boardColumnRepository.findAllByBoard_IdOrderByPosition(BOARD_ID)).thenReturn(List.of());
        when(boardMapper.toResponse(any(), any())).thenReturn(buildBoardResponse());

        boardService.updateBoard(USER_ID, "ORG_ADMIN", BOARD_ID,
                new UpdateBoardRequest(null, null, null));

        assertThat(board.getName()).isEqualTo("Sprint Board");
    }

    @Test
    void updateBoard_boardNotFound_throwsBoardNotFoundException() {
        when(boardRepository.findById(BOARD_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                boardService.updateBoard(USER_ID, "ORG_ADMIN", BOARD_ID,
                        new UpdateBoardRequest("New", null, null)))
                .isInstanceOf(BoardNotFoundException.class);
    }

    // =========================================================================
    // deleteBoard
    // =========================================================================

    @Test
    void deleteBoard_boardOwnerOrOrgOwner_deletesAndPublishesEvent() {
        Board board = buildBoard();
        when(boardRepository.findById(BOARD_ID)).thenReturn(Optional.of(board));

        boardService.deleteBoard(USER_ID, "ORG_OWNER", BOARD_ID);

        verify(boardRepository).delete(board);
        verify(boardEventPublisher).publishBoardDeleted(
                argThat(e -> e.boardId().equals(BOARD_ID) && e.orgId().equals(ORG_ID)));
    }

    @Test
    void deleteBoard_boardNotFound_throwsBoardNotFoundException() {
        when(boardRepository.findById(BOARD_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> boardService.deleteBoard(USER_ID, "ORG_OWNER", BOARD_ID))
                .isInstanceOf(BoardNotFoundException.class);

        verify(boardRepository, never()).delete(any());
        verify(boardEventPublisher, never()).publishBoardDeleted(any());
    }

    // =========================================================================
    // toggleArchive
    // =========================================================================

    @Test
    void toggleArchive_archivedToFalse_flipsToTrue() {
        Board board = buildBoard();
        assertThat(board.getIsArchived()).isFalse();

        when(boardRepository.findById(BOARD_ID)).thenReturn(Optional.of(board));
        when(boardRepository.save(board)).thenReturn(board);
        when(boardColumnRepository.findAllByBoard_IdOrderByPosition(BOARD_ID)).thenReturn(List.of());
        when(boardMapper.toResponse(any(), any())).thenReturn(buildBoardResponse());

        boardService.toggleArchive(USER_ID, "ORG_MEMBER", BOARD_ID);

        assertThat(board.getIsArchived()).isTrue();
        verify(boardAccessService).requireBoardRoleOrAdmin(USER_ID, "ORG_MEMBER", BOARD_ID, BoardRole.PRODUCT_OWNER);
    }

    @Test
    void toggleArchive_boardNotFound_throwsBoardNotFoundException() {
        when(boardRepository.findById(BOARD_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> boardService.toggleArchive(USER_ID, "ORG_ADMIN", BOARD_ID))
                .isInstanceOf(BoardNotFoundException.class);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private BoardColumn buildColumn(String name, int position) {
        return BoardColumn.builder()
                .id(UUID.randomUUID())
                .board(buildBoard())
                .name(name)
                .position(position)
                .build();
    }
}
