package io.bento.boardservice.service;

import io.bento.boardservice.dto.request.AddBoardMemberRequest;
import io.bento.boardservice.dto.request.UpdateBoardMemberRoleRequest;
import io.bento.boardservice.dto.response.BoardMemberResponse;
import io.bento.boardservice.entity.Board;
import io.bento.boardservice.entity.BoardMember;
import io.bento.boardservice.enums.BoardRole;
import io.bento.boardservice.enums.BoardType;
import io.bento.boardservice.event.BoardEventPublisher;
import io.bento.boardservice.exception.BoardAccessDeniedException;
import io.bento.boardservice.exception.BoardMemberAlreadyExistsException;
import io.bento.boardservice.exception.BoardMemberNotFoundException;
import io.bento.boardservice.exception.BoardNotFoundException;
import io.bento.boardservice.mapper.BoardMemberMapper;
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
class BoardMemberServiceTest {

    @Mock private BoardMemberRepository boardMemberRepository;
    @Mock private BoardRepository boardRepository;
    @Mock private BoardMemberMapper boardMemberMapper;
    @Mock private BoardAccessService boardAccessService;
    @Mock private BoardEventPublisher boardEventPublisher;

    @InjectMocks private BoardMemberService boardMemberService;

    private static final UUID CALLER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID TARGET_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID BOARD_ID  = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final UUID ORG_ID    = UUID.fromString("00000000-0000-0000-0000-000000000004");

    private Board buildBoard() {
        return Board.builder()
                .id(BOARD_ID)
                .orgId(ORG_ID)
                .name("Sprint Board")
                .boardKey("SB")
                .boardType(BoardType.SCRUM)
                .ownerId(CALLER_ID)
                .build();
    }

    private BoardMember buildMember(UUID userId, BoardRole role) {
        return BoardMember.builder()
                .id(UUID.randomUUID())
                .board(buildBoard())
                .userId(userId)
                .boardRole(role)
                .addedBy(CALLER_ID)
                .joinedAt(Instant.now())
                .build();
    }

    private BoardMemberResponse buildResponse(UUID userId, BoardRole role) {
        return new BoardMemberResponse(UUID.randomUUID(), BOARD_ID, userId, role, Instant.now(), CALLER_ID);
    }

    // =========================================================================
    // getMembers
    // =========================================================================

    @Test
    void getMembers_checksAccessAndReturnsMappedList() {
        BoardMember member = buildMember(CALLER_ID, BoardRole.DEVELOPER);
        BoardMemberResponse response = buildResponse(CALLER_ID, BoardRole.DEVELOPER);
        when(boardMemberRepository.findAllByBoard_Id(BOARD_ID)).thenReturn(List.of(member));
        when(boardMemberMapper.toResponse(member)).thenReturn(response);

        List<BoardMemberResponse> result = boardMemberService.getMembers(CALLER_ID, "ORG_MEMBER", BOARD_ID);

        verify(boardAccessService).requireBoardMemberOrAdmin(CALLER_ID, "ORG_MEMBER", BOARD_ID);
        assertThat(result).containsExactly(response);
    }

    @Test
    void getMembers_accessDenied_throwsAccessDeniedException() {
        doThrow(new BoardAccessDeniedException("denied"))
                .when(boardAccessService).requireBoardMemberOrAdmin(CALLER_ID, "ORG_MEMBER", BOARD_ID);

        assertThatThrownBy(() -> boardMemberService.getMembers(CALLER_ID, "ORG_MEMBER", BOARD_ID))
                .isInstanceOf(BoardAccessDeniedException.class);

        verifyNoInteractions(boardMemberRepository);
    }

    // =========================================================================
    // addMember
    // =========================================================================

    @Test
    void addMember_validRequest_savesAndPublishesEvent() {
        Board board = buildBoard();
        BoardMember saved = buildMember(TARGET_ID, BoardRole.DEVELOPER);
        BoardMemberResponse response = buildResponse(TARGET_ID, BoardRole.DEVELOPER);

        when(boardRepository.findById(BOARD_ID)).thenReturn(Optional.of(board));
        when(boardMemberRepository.existsByBoard_IdAndUserId(BOARD_ID, TARGET_ID)).thenReturn(false);
        when(boardMemberRepository.save(any())).thenReturn(saved);
        when(boardMemberMapper.toResponse(saved)).thenReturn(response);

        BoardMemberResponse result = boardMemberService.addMember(CALLER_ID, "ORG_MEMBER", BOARD_ID,
                new AddBoardMemberRequest(TARGET_ID, BoardRole.DEVELOPER));

        assertThat(result).isEqualTo(response);
        verify(boardAccessService).requireBoardMemberOrAdmin(CALLER_ID, "ORG_MEMBER", BOARD_ID);
        verify(boardEventPublisher).publishBoardMemberAdded(any());
    }

    @Test
    void addMember_savesWithCorrectFields() {
        Board board = buildBoard();
        when(boardRepository.findById(BOARD_ID)).thenReturn(Optional.of(board));
        when(boardMemberRepository.existsByBoard_IdAndUserId(BOARD_ID, TARGET_ID)).thenReturn(false);
        when(boardMemberRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(boardMemberMapper.toResponse(any())).thenReturn(buildResponse(TARGET_ID, BoardRole.SCRUM_MASTER));

        boardMemberService.addMember(CALLER_ID, "ORG_MEMBER", BOARD_ID,
                new AddBoardMemberRequest(TARGET_ID, BoardRole.SCRUM_MASTER));

        ArgumentCaptor<BoardMember> captor = ArgumentCaptor.forClass(BoardMember.class);
        verify(boardMemberRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(TARGET_ID);
        assertThat(captor.getValue().getBoardRole()).isEqualTo(BoardRole.SCRUM_MASTER);
        assertThat(captor.getValue().getAddedBy()).isEqualTo(CALLER_ID);
    }

    @Test
    void addMember_userAlreadyMember_throwsBoardMemberAlreadyExists() {
        when(boardRepository.findById(BOARD_ID)).thenReturn(Optional.of(buildBoard()));
        when(boardMemberRepository.existsByBoard_IdAndUserId(BOARD_ID, TARGET_ID)).thenReturn(true);

        assertThatThrownBy(() ->
                boardMemberService.addMember(CALLER_ID, "ORG_ADMIN", BOARD_ID,
                        new AddBoardMemberRequest(TARGET_ID, BoardRole.DEVELOPER)))
                .isInstanceOf(BoardMemberAlreadyExistsException.class);

        verify(boardMemberRepository, never()).save(any());
    }

    @Test
    void addMember_boardNotFound_throwsBoardNotFoundException() {
        when(boardRepository.findById(BOARD_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                boardMemberService.addMember(CALLER_ID, "ORG_ADMIN", BOARD_ID,
                        new AddBoardMemberRequest(TARGET_ID, BoardRole.DEVELOPER)))
                .isInstanceOf(BoardNotFoundException.class);
    }

    // =========================================================================
    // updateMemberRole
    // =========================================================================

    @Test
    void updateMemberRole_productOwnerCaller_updatesRole() {
        BoardMember member = buildMember(TARGET_ID, BoardRole.DEVELOPER);
        BoardMemberResponse response = buildResponse(TARGET_ID, BoardRole.SCRUM_MASTER);
        when(boardMemberRepository.findByBoard_IdAndUserId(BOARD_ID, TARGET_ID))
                .thenReturn(Optional.of(member));
        when(boardMemberRepository.save(member)).thenReturn(member);
        when(boardMemberMapper.toResponse(member)).thenReturn(response);

        BoardMemberResponse result = boardMemberService.updateMemberRole(
                CALLER_ID, "ORG_MEMBER", BOARD_ID, TARGET_ID,
                new UpdateBoardMemberRoleRequest(BoardRole.SCRUM_MASTER));

        assertThat(result).isEqualTo(response);
        assertThat(member.getBoardRole()).isEqualTo(BoardRole.SCRUM_MASTER);
        verify(boardAccessService).requireBoardRoleOrAdmin(CALLER_ID, "ORG_MEMBER", BOARD_ID, BoardRole.PRODUCT_OWNER);
    }

    @Test
    void updateMemberRole_memberNotFound_throwsBoardMemberNotFoundException() {
        when(boardMemberRepository.findByBoard_IdAndUserId(BOARD_ID, TARGET_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                boardMemberService.updateMemberRole(CALLER_ID, "ORG_ADMIN", BOARD_ID, TARGET_ID,
                        new UpdateBoardMemberRoleRequest(BoardRole.VIEWER)))
                .isInstanceOf(BoardMemberNotFoundException.class);
    }

    // =========================================================================
    // removeMember
    // =========================================================================

    @Test
    void removeMember_selfLeave_skipsAccessCheck() {
        BoardMember member = buildMember(CALLER_ID, BoardRole.DEVELOPER);
        when(boardMemberRepository.findByBoard_IdAndUserId(BOARD_ID, CALLER_ID))
                .thenReturn(Optional.of(member));

        boardMemberService.removeMember(CALLER_ID, "ORG_MEMBER", BOARD_ID, CALLER_ID);

        verify(boardAccessService, never()).requireBoardRoleOrAdmin(any(), any(), any(), any());
        verify(boardMemberRepository).delete(member);
        verify(boardEventPublisher).publishBoardMemberRemoved(any());
    }

    @Test
    void removeMember_removingOtherUser_requiresBoardRoleOrAdmin() {
        BoardMember member = buildMember(TARGET_ID, BoardRole.DEVELOPER);
        when(boardMemberRepository.findByBoard_IdAndUserId(BOARD_ID, TARGET_ID))
                .thenReturn(Optional.of(member));

        boardMemberService.removeMember(CALLER_ID, "ORG_MEMBER", BOARD_ID, TARGET_ID);

        verify(boardAccessService).requireBoardRoleOrAdmin(
                CALLER_ID, "ORG_MEMBER", BOARD_ID, BoardRole.PRODUCT_OWNER);
        verify(boardMemberRepository).delete(member);
    }

    @Test
    void removeMember_memberNotFound_throwsBoardMemberNotFoundException() {
        when(boardMemberRepository.findByBoard_IdAndUserId(BOARD_ID, TARGET_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                boardMemberService.removeMember(CALLER_ID, "ORG_ADMIN", BOARD_ID, TARGET_ID))
                .isInstanceOf(BoardMemberNotFoundException.class);

        verify(boardMemberRepository, never()).delete(any());
    }

    @Test
    void removeMember_publishesBoardMemberRemovedEvent() {
        BoardMember member = buildMember(TARGET_ID, BoardRole.DEVELOPER);
        when(boardMemberRepository.findByBoard_IdAndUserId(BOARD_ID, TARGET_ID))
                .thenReturn(Optional.of(member));

        boardMemberService.removeMember(CALLER_ID, "ORG_ADMIN", BOARD_ID, TARGET_ID);

        verify(boardEventPublisher).publishBoardMemberRemoved(
                argThat(e -> e.boardId().equals(BOARD_ID) && e.userId().equals(TARGET_ID)));
    }
}
