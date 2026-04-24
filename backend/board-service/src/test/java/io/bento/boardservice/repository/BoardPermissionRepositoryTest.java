package io.bento.boardservice.repository;

import io.bento.boardservice.entity.BoardPermission;
import io.bento.boardservice.enums.BoardPermissionKey;
import io.bento.boardservice.enums.BoardRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@TestPropertySource(properties = "spring.liquibase.enabled=false")
class BoardPermissionRepositoryTest {

    @Autowired
    private BoardPermissionRepository permissionRepository;

    private final UUID BOARD_A = UUID.randomUUID();
    private final UUID BOARD_B = UUID.randomUUID();

    private BoardPermission buildPermission(UUID boardId, BoardPermissionKey key, String allowedRoles) {
        return BoardPermission.builder()
                .boardId(boardId)
                .permissionKey(key)
                .allowedRoles(allowedRoles)
                .build();
    }

    // =========================================================================
    // Basic CRUD
    // =========================================================================

    @Test
    void save_persistsPermissionWithGeneratedId() {
        BoardPermission saved = permissionRepository.save(
                buildPermission(BOARD_A, BoardPermissionKey.CREATE_ISSUES, "DEVELOPER,SCRUM_MASTER"));

        assertThat(saved.getId()).isNotNull();
        assertThat(permissionRepository.findById(saved.getId())).isPresent();
    }

    @Test
    void save_storesAllowedRolesString() {
        BoardPermission saved = permissionRepository.save(
                buildPermission(BOARD_A, BoardPermissionKey.DELETE_ISSUES, "PRODUCT_OWNER"));

        assertThat(saved.getAllowedRoles()).isEqualTo("PRODUCT_OWNER");
    }

    // =========================================================================
    // findAllByBoardId
    // =========================================================================

    @Test
    void findAllByBoardId_returnsPermissionsForThatBoard() {
        permissionRepository.save(buildPermission(BOARD_A, BoardPermissionKey.CREATE_ISSUES, "DEVELOPER"));
        permissionRepository.save(buildPermission(BOARD_A, BoardPermissionKey.DELETE_ISSUES, "SCRUM_MASTER"));
        permissionRepository.save(buildPermission(BOARD_B, BoardPermissionKey.MOVE_ISSUES, "DEVELOPER"));

        List<BoardPermission> result = permissionRepository.findAllByBoardId(BOARD_A);

        assertThat(result).hasSize(2)
                .allMatch(p -> p.getBoardId().equals(BOARD_A));
    }

    @Test
    void findAllByBoardId_unknownBoard_returnsEmptyList() {
        permissionRepository.save(buildPermission(BOARD_A, BoardPermissionKey.CREATE_ISSUES, "DEVELOPER"));

        assertThat(permissionRepository.findAllByBoardId(UUID.randomUUID())).isEmpty();
    }

    @Test
    void findAllByBoardId_noPermissions_returnsEmptyList() {
        assertThat(permissionRepository.findAllByBoardId(BOARD_A)).isEmpty();
    }

    // =========================================================================
    // findByBoardIdAndPermissionKey
    // =========================================================================

    @Test
    void findByBoardIdAndPermissionKey_existingEntry_returnsPermission() {
        permissionRepository.save(
                buildPermission(BOARD_A, BoardPermissionKey.MANAGE_SPRINTS, "SCRUM_MASTER,PRODUCT_OWNER"));

        Optional<BoardPermission> result = permissionRepository
                .findByBoardIdAndPermissionKey(BOARD_A, BoardPermissionKey.MANAGE_SPRINTS);

        assertThat(result).isPresent()
                .get()
                .extracting(BoardPermission::getAllowedRoles)
                .isEqualTo("SCRUM_MASTER,PRODUCT_OWNER");
    }

    @Test
    void findByBoardIdAndPermissionKey_wrongKey_returnsEmpty() {
        permissionRepository.save(
                buildPermission(BOARD_A, BoardPermissionKey.CREATE_ISSUES, "DEVELOPER"));

        assertThat(permissionRepository.findByBoardIdAndPermissionKey(
                BOARD_A, BoardPermissionKey.DELETE_ISSUES)).isEmpty();
    }

    @Test
    void findByBoardIdAndPermissionKey_wrongBoardId_returnsEmpty() {
        permissionRepository.save(
                buildPermission(BOARD_A, BoardPermissionKey.CREATE_ISSUES, "DEVELOPER"));

        assertThat(permissionRepository.findByBoardIdAndPermissionKey(
                BOARD_B, BoardPermissionKey.CREATE_ISSUES)).isEmpty();
    }

    // =========================================================================
    // existsByBoardId
    // =========================================================================

    @Test
    void existsByBoardId_boardHasPermissions_returnsTrue() {
        permissionRepository.save(buildPermission(BOARD_A, BoardPermissionKey.VIEW_BOARD, "DEVELOPER"));

        assertThat(permissionRepository.existsByBoardId(BOARD_A)).isTrue();
    }

    @Test
    void existsByBoardId_unknownBoard_returnsFalse() {
        permissionRepository.save(buildPermission(BOARD_A, BoardPermissionKey.VIEW_BOARD, "DEVELOPER"));

        assertThat(permissionRepository.existsByBoardId(UUID.randomUUID())).isFalse();
    }

    @Test
    void existsByBoardId_noPermissionsAtAll_returnsFalse() {
        assertThat(permissionRepository.existsByBoardId(BOARD_A)).isFalse();
    }

    // =========================================================================
    // getAllowedRolesSet helper
    // =========================================================================

    @Test
    void getAllowedRolesSet_parsesStoredRolesCorrectly() {
        BoardPermission saved = permissionRepository.save(
                buildPermission(BOARD_A, BoardPermissionKey.EDIT_ISSUES, "DEVELOPER,SCRUM_MASTER"));

        Set<BoardRole> roles = saved.getAllowedRolesSet();

        assertThat(roles).containsExactlyInAnyOrder(BoardRole.DEVELOPER, BoardRole.SCRUM_MASTER);
    }

    @Test
    void getAllowedRolesSet_emptyAllowedRoles_returnsEmptySet() {
        BoardPermission saved = permissionRepository.save(
                buildPermission(BOARD_A, BoardPermissionKey.DELETE_ISSUES, ""));

        assertThat(saved.getAllowedRolesSet()).isEmpty();
    }

    @Test
    void hasRole_rolePresent_returnsTrue() {
        BoardPermission saved = permissionRepository.save(
                buildPermission(BOARD_A, BoardPermissionKey.MANAGE_COLUMNS, "SCRUM_MASTER,PRODUCT_OWNER"));

        assertThat(saved.hasRole(BoardRole.SCRUM_MASTER)).isTrue();
    }

    @Test
    void hasRole_roleAbsent_returnsFalse() {
        BoardPermission saved = permissionRepository.save(
                buildPermission(BOARD_A, BoardPermissionKey.MANAGE_COLUMNS, "SCRUM_MASTER"));

        assertThat(saved.hasRole(BoardRole.DEVELOPER)).isFalse();
    }

    // =========================================================================
    // Constraints
    // =========================================================================

    @Test
    void save_duplicateBoardIdAndPermissionKey_throwsDataIntegrityViolation() {
        permissionRepository.save(buildPermission(BOARD_A, BoardPermissionKey.CREATE_ISSUES, "DEVELOPER"));

        assertThatThrownBy(() -> permissionRepository.saveAndFlush(
                buildPermission(BOARD_A, BoardPermissionKey.CREATE_ISSUES, "VIEWER")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void save_samePermissionKeyDifferentBoard_succeeds() {
        permissionRepository.save(buildPermission(BOARD_A, BoardPermissionKey.CREATE_ISSUES, "DEVELOPER"));
        BoardPermission saved = permissionRepository.saveAndFlush(
                buildPermission(BOARD_B, BoardPermissionKey.CREATE_ISSUES, "VIEWER"));

        assertThat(saved.getId()).isNotNull();
    }
}
