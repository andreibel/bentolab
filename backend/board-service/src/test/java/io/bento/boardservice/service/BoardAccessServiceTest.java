package io.bento.boardservice.service;

import io.bento.boardservice.entity.BoardMember;
import io.bento.boardservice.enums.BoardRole;
import io.bento.boardservice.exception.BoardAccessDeniedException;
import io.bento.boardservice.repository.BoardMemberRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BoardAccessServiceTest {

    @Mock private BoardMemberRepository boardMemberRepository;

    @InjectMocks private BoardAccessService boardAccessService;

    private static final UUID USER_ID  = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID BOARD_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    // =========================================================================
    // isOrgAdmin
    // =========================================================================

    @Test
    void isOrgAdmin_orgAdmin_returnsTrue() {
        assertThat(boardAccessService.isOrgAdmin("ORG_ADMIN")).isTrue();
    }

    @Test
    void isOrgAdmin_orgOwner_returnsTrue() {
        assertThat(boardAccessService.isOrgAdmin("ORG_OWNER")).isTrue();
    }

    @Test
    void isOrgAdmin_orgMember_returnsFalse() {
        assertThat(boardAccessService.isOrgAdmin("ORG_MEMBER")).isFalse();
    }

    @Test
    void isOrgAdmin_null_returnsFalse() {
        assertThat(boardAccessService.isOrgAdmin(null)).isFalse();
    }

    // =========================================================================
    // isOrgOwner
    // =========================================================================

    @Test
    void isOrgOwner_orgOwner_returnsTrue() {
        assertThat(boardAccessService.isOrgOwner("ORG_OWNER")).isTrue();
    }

    @Test
    void isOrgOwner_orgAdmin_returnsFalse() {
        assertThat(boardAccessService.isOrgOwner("ORG_ADMIN")).isFalse();
    }

    @Test
    void isOrgOwner_orgMember_returnsFalse() {
        assertThat(boardAccessService.isOrgOwner("ORG_MEMBER")).isFalse();
    }

    // =========================================================================
    // getBoardRole
    // =========================================================================

    @Test
    void getBoardRole_memberExists_returnsMappedRole() {
        BoardMember member = BoardMember.builder().boardRole(BoardRole.DEVELOPER).build();
        when(boardMemberRepository.findByBoard_IdAndUserId(BOARD_ID, USER_ID))
                .thenReturn(Optional.of(member));

        assertThat(boardAccessService.getBoardRole(USER_ID, BOARD_ID))
                .isPresent()
                .get()
                .isEqualTo(BoardRole.DEVELOPER);
    }

    @Test
    void getBoardRole_noMember_returnsEmpty() {
        when(boardMemberRepository.findByBoard_IdAndUserId(BOARD_ID, USER_ID))
                .thenReturn(Optional.empty());

        assertThat(boardAccessService.getBoardRole(USER_ID, BOARD_ID)).isEmpty();
    }

    // =========================================================================
    // requireBoardMemberOrAdmin
    // =========================================================================

    @Test
    void requireBoardMemberOrAdmin_orgAdmin_doesNotCheckRepository() {
        boardAccessService.requireBoardMemberOrAdmin(USER_ID, "ORG_ADMIN", BOARD_ID);

        verifyNoInteractions(boardMemberRepository);
    }

    @Test
    void requireBoardMemberOrAdmin_orgOwner_doesNotCheckRepository() {
        boardAccessService.requireBoardMemberOrAdmin(USER_ID, "ORG_OWNER", BOARD_ID);

        verifyNoInteractions(boardMemberRepository);
    }

    @Test
    void requireBoardMemberOrAdmin_boardMember_passes() {
        when(boardMemberRepository.existsByBoard_IdAndUserId(BOARD_ID, USER_ID)).thenReturn(true);

        boardAccessService.requireBoardMemberOrAdmin(USER_ID, "ORG_MEMBER", BOARD_ID);

        verify(boardMemberRepository).existsByBoard_IdAndUserId(BOARD_ID, USER_ID);
    }

    @Test
    void requireBoardMemberOrAdmin_notMemberNotAdmin_throwsAccessDenied() {
        when(boardMemberRepository.existsByBoard_IdAndUserId(BOARD_ID, USER_ID)).thenReturn(false);

        assertThatThrownBy(() ->
                boardAccessService.requireBoardMemberOrAdmin(USER_ID, "ORG_MEMBER", BOARD_ID))
                .isInstanceOf(BoardAccessDeniedException.class);
    }

    // =========================================================================
    // requireBoardRoleOrAdmin
    // =========================================================================

    @Test
    void requireBoardRoleOrAdmin_orgAdmin_passes() {
        boardAccessService.requireBoardRoleOrAdmin(USER_ID, "ORG_ADMIN", BOARD_ID, BoardRole.PRODUCT_OWNER);

        verifyNoInteractions(boardMemberRepository);
    }

    @Test
    void requireBoardRoleOrAdmin_memberWithAllowedRole_passes() {
        BoardMember member = BoardMember.builder().boardRole(BoardRole.SCRUM_MASTER).build();
        when(boardMemberRepository.findByBoard_IdAndUserId(BOARD_ID, USER_ID))
                .thenReturn(Optional.of(member));

        boardAccessService.requireBoardRoleOrAdmin(
                USER_ID, "ORG_MEMBER", BOARD_ID, BoardRole.PRODUCT_OWNER, BoardRole.SCRUM_MASTER);
    }

    @Test
    void requireBoardRoleOrAdmin_memberWithInsufficientRole_throwsAccessDenied() {
        BoardMember member = BoardMember.builder().boardRole(BoardRole.DEVELOPER).build();
        when(boardMemberRepository.findByBoard_IdAndUserId(BOARD_ID, USER_ID))
                .thenReturn(Optional.of(member));

        assertThatThrownBy(() ->
                boardAccessService.requireBoardRoleOrAdmin(
                        USER_ID, "ORG_MEMBER", BOARD_ID, BoardRole.PRODUCT_OWNER))
                .isInstanceOf(BoardAccessDeniedException.class);
    }

    @Test
    void requireBoardRoleOrAdmin_notBoardMember_throwsAccessDenied() {
        when(boardMemberRepository.findByBoard_IdAndUserId(BOARD_ID, USER_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                boardAccessService.requireBoardRoleOrAdmin(
                        USER_ID, "ORG_MEMBER", BOARD_ID, BoardRole.PRODUCT_OWNER))
                .isInstanceOf(BoardAccessDeniedException.class);
    }

    // =========================================================================
    // requireBoardOwnerOrOrgOwner
    // =========================================================================

    @Test
    void requireBoardOwnerOrOrgOwner_orgOwner_passes() {
        boardAccessService.requireBoardOwnerOrOrgOwner(USER_ID, "ORG_OWNER", BOARD_ID);

        verifyNoInteractions(boardMemberRepository);
    }

    @Test
    void requireBoardOwnerOrOrgOwner_boardProductOwner_passes() {
        BoardMember member = BoardMember.builder().boardRole(BoardRole.PRODUCT_OWNER).build();
        when(boardMemberRepository.findByBoard_IdAndUserId(BOARD_ID, USER_ID))
                .thenReturn(Optional.of(member));

        boardAccessService.requireBoardOwnerOrOrgOwner(USER_ID, "ORG_MEMBER", BOARD_ID);
    }

    @Test
    void requireBoardOwnerOrOrgOwner_orgAdminButNotOrgOwner_throwsAccessDenied() {
        BoardMember member = BoardMember.builder().boardRole(BoardRole.SCRUM_MASTER).build();
        when(boardMemberRepository.findByBoard_IdAndUserId(BOARD_ID, USER_ID))
                .thenReturn(Optional.of(member));

        assertThatThrownBy(() ->
                boardAccessService.requireBoardOwnerOrOrgOwner(USER_ID, "ORG_ADMIN", BOARD_ID))
                .isInstanceOf(BoardAccessDeniedException.class);
    }

    @Test
    void requireBoardOwnerOrOrgOwner_notMember_throwsAccessDenied() {
        when(boardMemberRepository.findByBoard_IdAndUserId(BOARD_ID, USER_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                boardAccessService.requireBoardOwnerOrOrgOwner(USER_ID, "ORG_MEMBER", BOARD_ID))
                .isInstanceOf(BoardAccessDeniedException.class);
    }
}
