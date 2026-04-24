package io.bento.boardservice.service;

import io.bento.boardservice.dto.request.CreateColumnRequest;
import io.bento.boardservice.dto.request.ReorderColumnsRequest;
import io.bento.boardservice.dto.request.UpdateColumnRequest;
import io.bento.boardservice.dto.response.BoardColumnResponse;
import io.bento.boardservice.entity.Board;
import io.bento.boardservice.entity.BoardColumn;
import io.bento.boardservice.enums.BoardRole;
import io.bento.boardservice.enums.BoardType;
import io.bento.boardservice.event.BoardEventPublisher;
import io.bento.boardservice.exception.BoardAccessDeniedException;
import io.bento.boardservice.exception.BoardColumnNotFoundException;
import io.bento.boardservice.exception.BoardNotFoundException;
import io.bento.boardservice.mapper.BoardColumnMapper;
import io.bento.boardservice.repository.BoardColumnRepository;
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
class BoardColumnServiceTest {

    @Mock private BoardColumnRepository boardColumnRepository;
    @Mock private BoardRepository boardRepository;
    @Mock private BoardColumnMapper boardColumnMapper;
    @Mock private BoardAccessService boardAccessService;
    @Mock private BoardEventPublisher boardEventPublisher;

    @InjectMocks private BoardColumnService boardColumnService;

    private static final UUID USER_ID   = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID BOARD_ID  = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID COLUMN_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");

    private Board buildBoard() {
        return Board.builder()
                .id(BOARD_ID)
                .orgId(UUID.randomUUID())
                .name("Board")
                .boardKey("BRD")
                .boardType(BoardType.SCRUM)
                .ownerId(USER_ID)
                .build();
    }

    private BoardColumn buildColumn(String name, int position) {
        return BoardColumn.builder()
                .id(UUID.randomUUID())
                .board(buildBoard())
                .name(name)
                .position(position)
                .createdAt(Instant.now())
                .build();
    }

    private BoardColumnResponse buildResponse(UUID id, String name, int position) {
        return new BoardColumnResponse(id, BOARD_ID, name, position, null, null, false, false, Instant.now());
    }

    // =========================================================================
    // getColumns
    // =========================================================================

    @Test
    void getColumns_checksAccessAndReturnsMappedList() {
        BoardColumn col = buildColumn("To Do", 1);
        BoardColumnResponse response = buildResponse(col.getId(), "To Do", 1);
        when(boardColumnRepository.findAllByBoard_IdOrderByPosition(BOARD_ID)).thenReturn(List.of(col));
        when(boardColumnMapper.toResponse(col)).thenReturn(response);

        List<BoardColumnResponse> result = boardColumnService.getColumns(USER_ID, "ORG_MEMBER", BOARD_ID);

        verify(boardAccessService).requireBoardMemberOrAdmin(USER_ID, "ORG_MEMBER", BOARD_ID);
        assertThat(result).containsExactly(response);
    }

    @Test
    void getColumns_accessDenied_throwsAccessDenied() {
        doThrow(new BoardAccessDeniedException("denied"))
                .when(boardAccessService).requireBoardMemberOrAdmin(USER_ID, "ORG_MEMBER", BOARD_ID);

        assertThatThrownBy(() -> boardColumnService.getColumns(USER_ID, "ORG_MEMBER", BOARD_ID))
                .isInstanceOf(BoardAccessDeniedException.class);

        verifyNoInteractions(boardColumnRepository);
    }

    // =========================================================================
    // createColumn
    // =========================================================================

    @Test
    void createColumn_validRequest_savesWithNextPosition() {
        Board board = buildBoard();
        BoardColumn existing = buildColumn("To Do", 1);
        BoardColumn saved = buildColumn("In Progress", 2);
        BoardColumnResponse response = buildResponse(saved.getId(), "In Progress", 2);

        when(boardRepository.findById(BOARD_ID)).thenReturn(Optional.of(board));
        when(boardColumnRepository.findAllByBoard_IdOrderByPosition(BOARD_ID)).thenReturn(List.of(existing));
        when(boardColumnRepository.save(any())).thenReturn(saved);
        when(boardColumnMapper.toResponse(saved)).thenReturn(response);

        BoardColumnResponse result = boardColumnService.createColumn(USER_ID, "ORG_MEMBER", BOARD_ID,
                new CreateColumnRequest("In Progress", "#3B82F6", null, false, false));

        assertThat(result).isEqualTo(response);
        verify(boardAccessService).requireBoardRoleOrAdmin(USER_ID, "ORG_MEMBER", BOARD_ID,
                BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER);
    }

    @Test
    void createColumn_savesColumnWithCorrectPosition() {
        Board board = buildBoard();
        List<BoardColumn> existing = List.of(buildColumn("A", 1), buildColumn("B", 2));
        when(boardRepository.findById(BOARD_ID)).thenReturn(Optional.of(board));
        when(boardColumnRepository.findAllByBoard_IdOrderByPosition(BOARD_ID)).thenReturn(existing);
        when(boardColumnRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(boardColumnMapper.toResponse(any())).thenReturn(buildResponse(UUID.randomUUID(), "C", 3));

        boardColumnService.createColumn(USER_ID, "ORG_ADMIN", BOARD_ID,
                new CreateColumnRequest("C", null, null, null, null));

        ArgumentCaptor<BoardColumn> captor = ArgumentCaptor.forClass(BoardColumn.class);
        verify(boardColumnRepository).save(captor.capture());
        assertThat(captor.getValue().getPosition()).isEqualTo(3);
        assertThat(captor.getValue().getName()).isEqualTo("C");
    }

    @Test
    void createColumn_boardNotFound_throwsBoardNotFoundException() {
        when(boardRepository.findById(BOARD_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> boardColumnService.createColumn(USER_ID, "ORG_ADMIN", BOARD_ID,
                new CreateColumnRequest("New", null, null, null, null)))
                .isInstanceOf(BoardNotFoundException.class);
    }

    // =========================================================================
    // updateColumn
    // =========================================================================

    @Test
    void updateColumn_validRequest_updatesFieldsAndReturnsResponse() {
        BoardColumn column = buildColumn("Old Name", 1);
        column.setId(COLUMN_ID);
        BoardColumnResponse response = buildResponse(COLUMN_ID, "New Name", 1);

        when(boardColumnRepository.findByBoard_IdAndId(BOARD_ID, COLUMN_ID)).thenReturn(Optional.of(column));
        when(boardColumnRepository.save(column)).thenReturn(column);
        when(boardColumnMapper.toResponse(column)).thenReturn(response);

        BoardColumnResponse result = boardColumnService.updateColumn(USER_ID, "ORG_MEMBER", BOARD_ID, COLUMN_ID,
                new UpdateColumnRequest("New Name", "#FF0000", 5, null, null));

        assertThat(result).isEqualTo(response);
        assertThat(column.getName()).isEqualTo("New Name");
        assertThat(column.getColor()).isEqualTo("#FF0000");
        assertThat(column.getWipLimit()).isEqualTo(5);
        verify(boardAccessService).requireBoardRoleOrAdmin(USER_ID, "ORG_MEMBER", BOARD_ID,
                BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER);
    }

    @Test
    void updateColumn_nullName_doesNotOverwriteExistingName() {
        BoardColumn column = buildColumn("Keep Name", 1);
        column.setId(COLUMN_ID);
        when(boardColumnRepository.findByBoard_IdAndId(BOARD_ID, COLUMN_ID)).thenReturn(Optional.of(column));
        when(boardColumnRepository.save(column)).thenReturn(column);
        when(boardColumnMapper.toResponse(any())).thenReturn(buildResponse(COLUMN_ID, "Keep Name", 1));

        boardColumnService.updateColumn(USER_ID, "ORG_ADMIN", BOARD_ID, COLUMN_ID,
                new UpdateColumnRequest(null, null, null, null, null));

        assertThat(column.getName()).isEqualTo("Keep Name");
    }

    @Test
    void updateColumn_columnNotFound_throwsBoardColumnNotFoundException() {
        when(boardColumnRepository.findByBoard_IdAndId(BOARD_ID, COLUMN_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> boardColumnService.updateColumn(USER_ID, "ORG_ADMIN", BOARD_ID, COLUMN_ID,
                new UpdateColumnRequest("New", null, null, null, null)))
                .isInstanceOf(BoardColumnNotFoundException.class);
    }

    // =========================================================================
    // deleteColumn
    // =========================================================================

    @Test
    void deleteColumn_validRequest_deletesAndPublishesEvent() {
        BoardColumn column = buildColumn("Done", 3);
        column.setId(COLUMN_ID);
        when(boardColumnRepository.findByBoard_IdAndId(BOARD_ID, COLUMN_ID)).thenReturn(Optional.of(column));

        boardColumnService.deleteColumn(USER_ID, "ORG_MEMBER", BOARD_ID, COLUMN_ID);

        verify(boardColumnRepository).delete(column);
        verify(boardEventPublisher).publishBoardColumnDeleted(
                argThat(e -> e.columnId().equals(COLUMN_ID) && e.boardId().equals(BOARD_ID)));
    }

    @Test
    void deleteColumn_columnNotFound_throwsBoardColumnNotFoundException() {
        when(boardColumnRepository.findByBoard_IdAndId(BOARD_ID, COLUMN_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> boardColumnService.deleteColumn(USER_ID, "ORG_ADMIN", BOARD_ID, COLUMN_ID))
                .isInstanceOf(BoardColumnNotFoundException.class);

        verify(boardColumnRepository, never()).delete(any());
    }

    // =========================================================================
    // reorderColumns
    // =========================================================================

    @Test
    void reorderColumns_validRequest_reassignsPositions() {
        UUID col1Id = UUID.fromString("00000000-0000-0000-0000-000000000010");
        UUID col2Id = UUID.fromString("00000000-0000-0000-0000-000000000011");
        UUID col3Id = UUID.fromString("00000000-0000-0000-0000-000000000012");

        BoardColumn col1 = buildColumn("To Do", 1);       col1.setId(col1Id);
        BoardColumn col2 = buildColumn("In Progress", 2); col2.setId(col2Id);
        BoardColumn col3 = buildColumn("Done", 3);        col3.setId(col3Id);

        when(boardColumnRepository.findAllByBoard_IdOrderByPosition(BOARD_ID))
                .thenReturn(List.of(col1, col2, col3));
        when(boardColumnRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
        when(boardColumnMapper.toResponse(any())).thenAnswer(inv -> {
            BoardColumn c = inv.getArgument(0);
            return buildResponse(c.getId(), c.getName(), c.getPosition());
        });

        // Reorder: Done first, then In Progress, then To Do
        List<BoardColumnResponse> result = boardColumnService.reorderColumns(USER_ID, "ORG_MEMBER", BOARD_ID,
                new ReorderColumnsRequest(List.of(col3Id, col2Id, col1Id)));

        verify(boardAccessService).requireBoardRoleOrAdmin(USER_ID, "ORG_MEMBER", BOARD_ID,
                BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER);
        assertThat(col3.getPosition()).isEqualTo(1);
        assertThat(col2.getPosition()).isEqualTo(2);
        assertThat(col1.getPosition()).isEqualTo(3);
    }
}
