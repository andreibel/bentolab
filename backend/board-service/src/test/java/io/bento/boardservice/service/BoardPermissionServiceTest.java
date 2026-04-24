package io.bento.boardservice.service;

import io.bento.boardservice.dto.request.UpdateBoardPermissionRequest;
import io.bento.boardservice.dto.response.BoardPermissionResponse;
import io.bento.boardservice.entity.BoardPermission;
import io.bento.boardservice.enums.BoardPermissionKey;
import io.bento.boardservice.enums.BoardRole;
import io.bento.boardservice.exception.BoardAccessDeniedException;
import io.bento.boardservice.repository.BoardPermissionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BoardPermissionServiceTest {

    @Mock private BoardPermissionRepository boardPermissionRepository;

    @InjectMocks private BoardPermissionService boardPermissionService;

    private static final UUID BOARD_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private BoardPermission buildPermission(BoardPermissionKey key, String allowedRoles) {
        BoardPermission p = BoardPermission.builder()
                .boardId(BOARD_ID)
                .permissionKey(key)
                .allowedRoles(allowedRoles)
                .build();
        return p;
    }

    // =========================================================================
    // initializeDefaults
    // =========================================================================

    @Test
    void initializeDefaults_notYetInitialized_savesAllPermissionKeys() {
        when(boardPermissionRepository.existsByBoardId(BOARD_ID)).thenReturn(false);
        when(boardPermissionRepository.saveAll(any())).thenReturn(List.of());

        boardPermissionService.initializeDefaults(BOARD_ID);

        ArgumentCaptor<List<BoardPermission>> captor = ArgumentCaptor.forClass(List.class);
        verify(boardPermissionRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(BoardPermissionKey.values().length);
    }

    @Test
    void initializeDefaults_alreadyInitialized_skipsCreation() {
        when(boardPermissionRepository.existsByBoardId(BOARD_ID)).thenReturn(true);

        boardPermissionService.initializeDefaults(BOARD_ID);

        verify(boardPermissionRepository, never()).saveAll(any());
    }

    @Test
    void initializeDefaults_createsPermissionsWithCorrectBoardId() {
        when(boardPermissionRepository.existsByBoardId(BOARD_ID)).thenReturn(false);
        when(boardPermissionRepository.saveAll(any())).thenReturn(List.of());

        boardPermissionService.initializeDefaults(BOARD_ID);

        ArgumentCaptor<List<BoardPermission>> captor = ArgumentCaptor.forClass(List.class);
        verify(boardPermissionRepository).saveAll(captor.capture());
        captor.getValue().forEach(p -> assertThat(p.getBoardId()).isEqualTo(BOARD_ID));
    }

    // =========================================================================
    // getPermissions
    // =========================================================================

    @Test
    void getPermissions_dbHasPermissions_returnsMappedResponses() {
        List<BoardPermission> stored = List.of(
                buildPermission(BoardPermissionKey.CREATE_ISSUES, "DEVELOPER,SCRUM_MASTER"),
                buildPermission(BoardPermissionKey.DELETE_ISSUES, "PRODUCT_OWNER")
        );
        when(boardPermissionRepository.findAllByBoardId(BOARD_ID)).thenReturn(stored);

        List<BoardPermissionResponse> result = boardPermissionService.getPermissions(BOARD_ID);

        assertThat(result).hasSize(2);
        assertThat(result).extracting(BoardPermissionResponse::permissionKey)
                .containsExactlyInAnyOrder("CREATE_ISSUES", "DELETE_ISSUES");
    }

    @Test
    void getPermissions_dbEmpty_returnsDefaultsForAllKeys() {
        when(boardPermissionRepository.findAllByBoardId(BOARD_ID)).thenReturn(List.of());

        List<BoardPermissionResponse> result = boardPermissionService.getPermissions(BOARD_ID);

        assertThat(result).hasSize(BoardPermissionKey.values().length);
    }

    @Test
    void getPermissions_dbEmpty_defaultForCreateIssuesIncludesDeveloper() {
        when(boardPermissionRepository.findAllByBoardId(BOARD_ID)).thenReturn(List.of());

        List<BoardPermissionResponse> result = boardPermissionService.getPermissions(BOARD_ID);

        BoardPermissionResponse createIssues = result.stream()
                .filter(r -> r.permissionKey().equals("CREATE_ISSUES"))
                .findFirst().orElseThrow();
        assertThat(createIssues.allowedRoles()).contains("DEVELOPER");
    }

    // =========================================================================
    // updatePermission
    // =========================================================================

    @Test
    void updatePermission_unlockableKey_updatesAndReturnResponse() {
        BoardPermission existing = buildPermission(BoardPermissionKey.CREATE_ISSUES, "DEVELOPER");
        when(boardPermissionRepository.findByBoardIdAndPermissionKey(BOARD_ID, BoardPermissionKey.CREATE_ISSUES))
                .thenReturn(Optional.of(existing));
        when(boardPermissionRepository.save(any())).thenReturn(existing);

        BoardPermissionResponse result = boardPermissionService.updatePermission(
                BOARD_ID, "CREATE_ISSUES",
                new UpdateBoardPermissionRequest(Set.of("DEVELOPER", "SCRUM_MASTER")));

        assertThat(result.permissionKey()).isEqualTo("CREATE_ISSUES");
        assertThat(result.allowedRoles()).containsExactlyInAnyOrder("DEVELOPER", "SCRUM_MASTER");
    }

    @Test
    void updatePermission_permissionNotInDb_createsNew() {
        when(boardPermissionRepository.findByBoardIdAndPermissionKey(BOARD_ID, BoardPermissionKey.MOVE_ISSUES))
                .thenReturn(Optional.empty());
        when(boardPermissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        boardPermissionService.updatePermission(
                BOARD_ID, "MOVE_ISSUES",
                new UpdateBoardPermissionRequest(Set.of("DEVELOPER")));

        ArgumentCaptor<BoardPermission> captor = ArgumentCaptor.forClass(BoardPermission.class);
        verify(boardPermissionRepository).save(captor.capture());
        assertThat(captor.getValue().getBoardId()).isEqualTo(BOARD_ID);
        assertThat(captor.getValue().getPermissionKey()).isEqualTo(BoardPermissionKey.MOVE_ISSUES);
    }

    @Test
    void updatePermission_unknownKey_throwsIllegalArgument() {
        assertThatThrownBy(() ->
                boardPermissionService.updatePermission(BOARD_ID, "NON_EXISTENT_KEY",
                        new UpdateBoardPermissionRequest(Set.of("DEVELOPER"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown permission key");
    }

    @Test
    void updatePermission_lockedKey_throwsAccessDenied() {
        // ADMINISTER_BOARD is locked
        assertThatThrownBy(() ->
                boardPermissionService.updatePermission(BOARD_ID, "ADMINISTER_BOARD",
                        new UpdateBoardPermissionRequest(Set.of("DEVELOPER"))))
                .isInstanceOf(BoardAccessDeniedException.class);

        verify(boardPermissionRepository, never()).save(any());
    }

    @Test
    void updatePermission_viewBoardIsLocked_throwsAccessDenied() {
        assertThatThrownBy(() ->
                boardPermissionService.updatePermission(BOARD_ID, "VIEW_BOARD",
                        new UpdateBoardPermissionRequest(Set.of("DEVELOPER"))))
                .isInstanceOf(BoardAccessDeniedException.class);
    }

    @Test
    void updatePermission_unknownRoleName_throwsIllegalArgument() {
        assertThatThrownBy(() ->
                boardPermissionService.updatePermission(BOARD_ID, "CREATE_ISSUES",
                        new UpdateBoardPermissionRequest(Set.of("NOT_A_ROLE"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown role");
    }
}
