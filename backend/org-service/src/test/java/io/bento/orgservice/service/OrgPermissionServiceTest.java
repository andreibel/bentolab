package io.bento.orgservice.service;

import io.bento.orgservice.dto.request.UpdateOrgPermissionRequest;
import io.bento.orgservice.dto.response.OrgPermissionResponse;
import io.bento.orgservice.entity.OrgPermission;
import io.bento.orgservice.enums.OrgPermissionKey;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.exception.OrgAccessDeniedException;
import io.bento.orgservice.repository.OrgPermissionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrgPermissionServiceTest {

    @Mock private OrgPermissionRepository orgPermissionRepository;

    @InjectMocks private OrgPermissionService orgPermissionService;

    private static final UUID ORG_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    // =========================================================================
    // initializeDefaults
    // =========================================================================

    @Test
    void initializeDefaults_newOrg_savesAllPermissionKeys() {
        when(orgPermissionRepository.existsByOrgId(ORG_ID)).thenReturn(false);

        orgPermissionService.initializeDefaults(ORG_ID);

        ArgumentCaptor<List<OrgPermission>> captor = ArgumentCaptor.forClass(List.class);
        verify(orgPermissionRepository).saveAll(captor.capture());
        List<OrgPermission> saved = captor.getValue();
        assertThat(saved).hasSize(OrgPermissionKey.values().length);
        Set<OrgPermissionKey> savedKeys = saved.stream()
                .map(OrgPermission::getPermissionKey).collect(Collectors.toSet());
        assertThat(savedKeys).containsExactlyInAnyOrder(OrgPermissionKey.values());
    }

    @Test
    void initializeDefaults_alreadyInitialized_skipsAndDoesNotSave() {
        when(orgPermissionRepository.existsByOrgId(ORG_ID)).thenReturn(true);

        orgPermissionService.initializeDefaults(ORG_ID);

        verify(orgPermissionRepository, never()).saveAll(any());
    }

    @Test
    void initializeDefaults_administerOrg_ownerOnly() {
        when(orgPermissionRepository.existsByOrgId(ORG_ID)).thenReturn(false);

        orgPermissionService.initializeDefaults(ORG_ID);

        ArgumentCaptor<List<OrgPermission>> captor = ArgumentCaptor.forClass(List.class);
        verify(orgPermissionRepository).saveAll(captor.capture());
        OrgPermission administerPerm = captor.getValue().stream()
                .filter(p -> p.getPermissionKey() == OrgPermissionKey.ADMINISTER_ORG)
                .findFirst().orElseThrow();
        assertThat(administerPerm.getAllowedRolesSet()).containsExactly(OrgRoles.ORG_OWNER);
    }

    @Test
    void initializeDefaults_viewMembers_allRolesIncluded() {
        when(orgPermissionRepository.existsByOrgId(ORG_ID)).thenReturn(false);

        orgPermissionService.initializeDefaults(ORG_ID);

        ArgumentCaptor<List<OrgPermission>> captor = ArgumentCaptor.forClass(List.class);
        verify(orgPermissionRepository).saveAll(captor.capture());
        OrgPermission viewMembersPerm = captor.getValue().stream()
                .filter(p -> p.getPermissionKey() == OrgPermissionKey.VIEW_MEMBERS)
                .findFirst().orElseThrow();
        assertThat(viewMembersPerm.getAllowedRolesSet())
                .containsExactlyInAnyOrder(OrgRoles.ORG_OWNER, OrgRoles.ORG_ADMIN, OrgRoles.ORG_MEMBER);
    }

    // =========================================================================
    // getPermissions
    // =========================================================================

    @Test
    void getPermissions_fromDb_returnsMappedResponses() {
        List<OrgPermission> perms = Arrays.stream(OrgPermissionKey.values())
                .map(k -> buildPermission(k, Set.of(OrgRoles.ORG_OWNER)))
                .toList();
        when(orgPermissionRepository.findAllByOrgId(ORG_ID)).thenReturn(perms);

        List<OrgPermissionResponse> result = orgPermissionService.getPermissions(ORG_ID);

        assertThat(result).hasSize(OrgPermissionKey.values().length);
        assertThat(result.get(0).permissionKey()).isNotNull();
        assertThat(result.get(0).label()).isNotNull();
    }

    @Test
    void getPermissions_emptyDb_returnsDefaultsWithoutPersisting() {
        when(orgPermissionRepository.findAllByOrgId(ORG_ID)).thenReturn(List.of());

        List<OrgPermissionResponse> result = orgPermissionService.getPermissions(ORG_ID);

        assertThat(result).hasSize(OrgPermissionKey.values().length);
        verify(orgPermissionRepository, never()).saveAll(any());
    }

    @Test
    void getPermissions_emptyDb_lockedKeyMarkedCorrectly() {
        when(orgPermissionRepository.findAllByOrgId(ORG_ID)).thenReturn(List.of());

        List<OrgPermissionResponse> result = orgPermissionService.getPermissions(ORG_ID);

        OrgPermissionResponse administerResp = result.stream()
                .filter(r -> r.permissionKey().equals(OrgPermissionKey.ADMINISTER_ORG.name()))
                .findFirst().orElseThrow();
        assertThat(administerResp.locked()).isTrue();
    }

    // =========================================================================
    // updatePermission
    // =========================================================================

    @Test
    void updatePermission_asOwner_validKey_updatesRoles() {
        OrgPermission existing = buildPermission(OrgPermissionKey.MANAGE_BOARDS, Set.of(OrgRoles.ORG_OWNER));
        when(orgPermissionRepository.findByOrgIdAndPermissionKey(ORG_ID, OrgPermissionKey.MANAGE_BOARDS))
                .thenReturn(Optional.of(existing));
        when(orgPermissionRepository.save(existing)).thenReturn(existing);

        OrgPermissionResponse result = orgPermissionService.updatePermission(
                ORG_ID, "MANAGE_BOARDS",
                new UpdateOrgPermissionRequest(Set.of("ORG_OWNER", "ORG_ADMIN", "ORG_MEMBER")),
                OrgRoles.ORG_OWNER);

        assertThat(result.allowedRoles()).containsExactlyInAnyOrder("ORG_OWNER", "ORG_ADMIN", "ORG_MEMBER");
        verify(orgPermissionRepository).save(existing);
    }

    @Test
    void updatePermission_asAdmin_throwsAccessDenied() {
        assertThatThrownBy(() ->
                orgPermissionService.updatePermission(ORG_ID, "MANAGE_BOARDS",
                        new UpdateOrgPermissionRequest(Set.of("ORG_OWNER")), OrgRoles.ORG_ADMIN))
                .isInstanceOf(OrgAccessDeniedException.class);
    }

    @Test
    void updatePermission_unknownKey_throwsIllegalArgument() {
        assertThatThrownBy(() ->
                orgPermissionService.updatePermission(ORG_ID, "UNKNOWN_KEY",
                        new UpdateOrgPermissionRequest(Set.of("ORG_OWNER")), OrgRoles.ORG_OWNER))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("UNKNOWN_KEY");
    }

    @Test
    void updatePermission_lockedKey_throwsAccessDenied() {
        assertThatThrownBy(() ->
                orgPermissionService.updatePermission(ORG_ID, "ADMINISTER_ORG",
                        new UpdateOrgPermissionRequest(Set.of("ORG_OWNER")), OrgRoles.ORG_OWNER))
                .isInstanceOf(OrgAccessDeniedException.class)
                .hasMessageContaining("locked");
    }

    @Test
    void updatePermission_unknownRole_throwsIllegalArgument() {
        assertThatThrownBy(() ->
                orgPermissionService.updatePermission(ORG_ID, "MANAGE_BOARDS",
                        new UpdateOrgPermissionRequest(Set.of("SUPER_ADMIN")), OrgRoles.ORG_OWNER))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("SUPER_ADMIN");
    }

    @Test
    void updatePermission_permissionNotInDb_createsNew() {
        when(orgPermissionRepository.findByOrgIdAndPermissionKey(ORG_ID, OrgPermissionKey.MANAGE_LABELS))
                .thenReturn(Optional.empty());
        when(orgPermissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        OrgPermissionResponse result = orgPermissionService.updatePermission(
                ORG_ID, "MANAGE_LABELS",
                new UpdateOrgPermissionRequest(Set.of("ORG_OWNER")),
                OrgRoles.ORG_OWNER);

        assertThat(result.allowedRoles()).containsExactly("ORG_OWNER");
    }

    @Test
    void updatePermission_emptyRoles_clearsPermissions() {
        OrgPermission existing = buildPermission(OrgPermissionKey.MANAGE_BOARDS, Set.of(OrgRoles.ORG_OWNER));
        when(orgPermissionRepository.findByOrgIdAndPermissionKey(ORG_ID, OrgPermissionKey.MANAGE_BOARDS))
                .thenReturn(Optional.of(existing));
        when(orgPermissionRepository.save(existing)).thenReturn(existing);

        OrgPermissionResponse result = orgPermissionService.updatePermission(
                ORG_ID, "MANAGE_BOARDS",
                new UpdateOrgPermissionRequest(Set.of()),
                OrgRoles.ORG_OWNER);

        assertThat(result.allowedRoles()).isEmpty();
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private OrgPermission buildPermission(OrgPermissionKey key, Set<OrgRoles> roles) {
        OrgPermission p = OrgPermission.builder().orgId(ORG_ID).permissionKey(key).build();
        p.setAllowedRolesSet(roles);
        return p;
    }
}
