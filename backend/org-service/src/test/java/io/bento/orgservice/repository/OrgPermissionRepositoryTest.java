package io.bento.orgservice.repository;

import io.bento.orgservice.entity.OrgPermission;
import io.bento.orgservice.enums.OrgPermissionKey;
import io.bento.orgservice.enums.OrgRoles;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.annotation.DirtiesContext;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class OrgPermissionRepositoryTest {

    @Autowired private OrgPermissionRepository permissionRepository;

    private static final UUID ORG_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    // =========================================================================
    // Basic CRUD
    // =========================================================================

    @Test
    void save_persistsPermissionWithGeneratedId() {
        OrgPermission saved = permissionRepository.save(buildPermission(ORG_ID, OrgPermissionKey.VIEW_MEMBERS));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getOrgId()).isEqualTo(ORG_ID);
        assertThat(saved.getPermissionKey()).isEqualTo(OrgPermissionKey.VIEW_MEMBERS);
    }

    @Test
    void save_allowedRolesSet_persistedAndRetrievedCorrectly() {
        OrgPermission perm = buildPermission(ORG_ID, OrgPermissionKey.MANAGE_BOARDS);
        perm.setAllowedRolesSet(Set.of(OrgRoles.ORG_OWNER, OrgRoles.ORG_ADMIN));
        OrgPermission saved = permissionRepository.save(perm);

        assertThat(saved.getAllowedRolesSet()).containsExactlyInAnyOrder(OrgRoles.ORG_OWNER, OrgRoles.ORG_ADMIN);
    }

    // =========================================================================
    // findAllByOrgId
    // =========================================================================

    @Test
    void findAllByOrgId_returnsPermissionsForOrg() {
        permissionRepository.save(buildPermission(ORG_ID, OrgPermissionKey.VIEW_MEMBERS));
        permissionRepository.save(buildPermission(ORG_ID, OrgPermissionKey.MANAGE_BOARDS));

        List<OrgPermission> result = permissionRepository.findAllByOrgId(ORG_ID);

        assertThat(result).hasSize(2);
    }

    @Test
    void findAllByOrgId_differentOrg_returnsEmpty() {
        permissionRepository.save(buildPermission(ORG_ID, OrgPermissionKey.VIEW_MEMBERS));

        List<OrgPermission> result = permissionRepository.findAllByOrgId(UUID.randomUUID());

        assertThat(result).isEmpty();
    }

    // =========================================================================
    // findByOrgIdAndPermissionKey
    // =========================================================================

    @Test
    void findByOrgIdAndPermissionKey_whenExists_returnsPresent() {
        permissionRepository.save(buildPermission(ORG_ID, OrgPermissionKey.MANAGE_MEMBERS));

        Optional<OrgPermission> result =
                permissionRepository.findByOrgIdAndPermissionKey(ORG_ID, OrgPermissionKey.MANAGE_MEMBERS);

        assertThat(result).isPresent();
    }

    @Test
    void findByOrgIdAndPermissionKey_whenNotExists_returnsEmpty() {
        Optional<OrgPermission> result =
                permissionRepository.findByOrgIdAndPermissionKey(ORG_ID, OrgPermissionKey.MANAGE_MEMBERS);

        assertThat(result).isEmpty();
    }

    @Test
    void findByOrgIdAndPermissionKey_wrongOrg_returnsEmpty() {
        permissionRepository.save(buildPermission(ORG_ID, OrgPermissionKey.MANAGE_MEMBERS));

        Optional<OrgPermission> result =
                permissionRepository.findByOrgIdAndPermissionKey(UUID.randomUUID(), OrgPermissionKey.MANAGE_MEMBERS);

        assertThat(result).isEmpty();
    }

    // =========================================================================
    // existsByOrgId
    // =========================================================================

    @Test
    void existsByOrgId_whenPermissionsExist_returnsTrue() {
        permissionRepository.save(buildPermission(ORG_ID, OrgPermissionKey.VIEW_MEMBERS));

        assertThat(permissionRepository.existsByOrgId(ORG_ID)).isTrue();
    }

    @Test
    void existsByOrgId_whenNoPermissions_returnsFalse() {
        assertThat(permissionRepository.existsByOrgId(ORG_ID)).isFalse();
    }

    // =========================================================================
    // Constraints
    // =========================================================================

    @Test
    void save_duplicateOrgAndKey_throwsConstraintViolation() {
        permissionRepository.save(buildPermission(ORG_ID, OrgPermissionKey.MANAGE_LABELS));

        assertThatThrownBy(() ->
                permissionRepository.saveAndFlush(buildPermission(ORG_ID, OrgPermissionKey.MANAGE_LABELS)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private OrgPermission buildPermission(UUID orgId, OrgPermissionKey key) {
        OrgPermission p = OrgPermission.builder()
                .orgId(orgId)
                .permissionKey(key)
                .build();
        p.setAllowedRolesSet(Set.of(OrgRoles.ORG_OWNER));
        return p;
    }
}
