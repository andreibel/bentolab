package io.bento.orgservice.service;

import io.bento.orgservice.dto.request.CreateOrgRequest;
import io.bento.orgservice.dto.request.TransferOrgOwnershipRequest;
import io.bento.orgservice.dto.request.UpdateOrgRequest;
import io.bento.orgservice.dto.request.UpdateOrgSettingsRequest;
import io.bento.orgservice.dto.response.OrgResponse;
import io.bento.orgservice.entity.Organization;
import io.bento.orgservice.entity.OrganizationMember;
import io.bento.orgservice.enums.OrgPlan;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.exception.OrgAccessDeniedException;
import io.bento.orgservice.exception.OrgNotFoundException;
import io.bento.orgservice.exception.SlugAlreadyExistsException;
import io.bento.orgservice.mapper.OrgMapper;
import io.bento.orgservice.repository.OrganizationMemberRepository;
import io.bento.orgservice.repository.OrganizationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrgServiceTest {

    @Mock private OrganizationRepository organizationRepository;
    @Mock private OrganizationMemberRepository organizationMemberRepository;
    @Mock private OrgMapper orgMapper;
    @Mock private OrgPermissionService orgPermissionService;

    @InjectMocks private OrgService orgService;

    private static final UUID USER_ID  = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID ORG_ID   = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID USER2_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");

    // =========================================================================
    // createOrg
    // =========================================================================

    @Test
    void createOrg_newSlug_savesOrgMemberAndPermissions() {
        CreateOrgRequest req = new CreateOrgRequest("Acme", "acme", null, null, null);
        Organization entity = buildOrg(ORG_ID, "acme", USER_ID);
        OrgResponse response = orgResponse(ORG_ID, "acme");

        when(organizationRepository.existsBySlug("acme")).thenReturn(false);
        when(orgMapper.toEntity(req, USER_ID)).thenReturn(entity);
        when(organizationRepository.save(entity)).thenReturn(entity);
        when(organizationMemberRepository.save(any())).thenReturn(ownerMember(ORG_ID, USER_ID));
        when(orgMapper.toResponse(entity)).thenReturn(response);

        OrgResponse result = orgService.createOrg(USER_ID, req);

        assertThat(result).isEqualTo(response);
        verify(organizationMemberRepository).save(argThat(m ->
                m.getUserId().equals(USER_ID) && m.getOrgRole() == OrgRoles.ORG_OWNER));
        verify(orgPermissionService).initializeDefaults(ORG_ID);
    }

    @Test
    void createOrg_duplicateSlug_throwsSlugAlreadyExists() {
        when(organizationRepository.existsBySlug("acme")).thenReturn(true);

        assertThatThrownBy(() ->
                orgService.createOrg(USER_ID, new CreateOrgRequest("Acme", "acme", null, null, null)))
                .isInstanceOf(SlugAlreadyExistsException.class)
                .hasMessageContaining("acme");
    }

    // =========================================================================
    // getMyOrgs
    // =========================================================================

    @Test
    void getMyOrgs_returnsMappedOrgList() {
        Organization org = buildOrg(ORG_ID, "acme", USER_ID);
        when(organizationRepository.findAllByMemberUserId(USER_ID)).thenReturn(List.of(org));
        when(orgMapper.toResponse(org)).thenReturn(orgResponse(ORG_ID, "acme"));

        List<OrgResponse> result = orgService.getMyOrgs(USER_ID);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).slug()).isEqualTo("acme");
    }

    @Test
    void getMyOrgs_noOrgs_returnsEmpty() {
        when(organizationRepository.findAllByMemberUserId(USER_ID)).thenReturn(List.of());

        assertThat(orgService.getMyOrgs(USER_ID)).isEmpty();
    }

    // =========================================================================
    // getOrgById
    // =========================================================================

    @Test
    void getOrgById_whenExists_returnsOrgResponse() {
        Organization org = buildOrg(ORG_ID, "acme", USER_ID);
        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.of(org));
        when(orgMapper.toResponse(org)).thenReturn(orgResponse(ORG_ID, "acme"));

        OrgResponse result = orgService.getOrgById(ORG_ID);

        assertThat(result.id()).isEqualTo(ORG_ID);
    }

    @Test
    void getOrgById_notFound_throwsOrgNotFoundException() {
        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orgService.getOrgById(ORG_ID))
                .isInstanceOf(OrgNotFoundException.class);
    }

    // =========================================================================
    // updateOrg
    // =========================================================================

    @Test
    void updateOrg_asOwner_updatesFields() {
        Organization org = buildOrg(ORG_ID, "acme", USER_ID);
        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.of(org));
        when(organizationRepository.save(org)).thenReturn(org);
        when(orgMapper.toResponse(org)).thenReturn(orgResponse(ORG_ID, "acme"));

        orgService.updateOrg(ORG_ID, OrgRoles.ORG_OWNER,
                new UpdateOrgRequest("New Name", "new.domain", "https://logo.png", "desc"));

        assertThat(org.getName()).isEqualTo("New Name");
        assertThat(org.getDomain()).isEqualTo("new.domain");
        assertThat(org.getLogoUrl()).isEqualTo("https://logo.png");
        assertThat(org.getDescription()).isEqualTo("desc");
    }

    @Test
    void updateOrg_asAdmin_succeeds() {
        Organization org = buildOrg(ORG_ID, "acme", USER_ID);
        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.of(org));
        when(organizationRepository.save(org)).thenReturn(org);
        when(orgMapper.toResponse(org)).thenReturn(orgResponse(ORG_ID, "acme"));

        assertThatCode(() -> orgService.updateOrg(ORG_ID, OrgRoles.ORG_ADMIN,
                new UpdateOrgRequest("Admin Update", null, null, null)))
                .doesNotThrowAnyException();
    }

    @Test
    void updateOrg_asMember_throwsAccessDenied() {
        assertThatThrownBy(() ->
                orgService.updateOrg(ORG_ID, OrgRoles.ORG_MEMBER, new UpdateOrgRequest(null, null, null, null)))
                .isInstanceOf(OrgAccessDeniedException.class);
    }

    @Test
    void updateOrg_notFound_throwsOrgNotFoundException() {
        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                orgService.updateOrg(ORG_ID, OrgRoles.ORG_ADMIN, new UpdateOrgRequest("x", null, null, null)))
                .isInstanceOf(OrgNotFoundException.class);
    }

    @Test
    void updateOrg_nullAndBlankFields_notUpdated() {
        Organization org = buildOrg(ORG_ID, "acme", USER_ID);
        org.setName("Original");
        org.setDomain("original.com");
        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.of(org));
        when(organizationRepository.save(org)).thenReturn(org);
        when(orgMapper.toResponse(org)).thenReturn(orgResponse(ORG_ID, "acme"));

        orgService.updateOrg(ORG_ID, OrgRoles.ORG_OWNER, new UpdateOrgRequest(null, "", null, null));

        assertThat(org.getName()).isEqualTo("Original");
        assertThat(org.getDomain()).isEqualTo("original.com");
    }

    // =========================================================================
    // updateOrgSettings
    // =========================================================================

    @Test
    void updateOrgSettings_asAdmin_updatesSettings() {
        Organization org = buildOrg(ORG_ID, "acme", USER_ID);
        org.setSettings(new HashMap<>());
        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.of(org));
        when(organizationRepository.save(org)).thenReturn(org);
        when(orgMapper.toResponse(org)).thenReturn(orgResponse(ORG_ID, "acme"));

        orgService.updateOrgSettings(ORG_ID, OrgRoles.ORG_ADMIN,
                new UpdateOrgSettingsRequest(50, 10, 100.0, true, false, null, null));

        assertThat(org.getSettings()).containsEntry("maxUsers", 50);
        assertThat(org.getSettings()).containsEntry("maxBoards", 10);
        assertThat(org.getSettings()).containsEntry("maxStorageGB", 100.0);
        assertThat(org.getSettings()).containsEntry("allowDiscord", true);
        assertThat(org.getSettings()).containsEntry("allowExport", false);
        assertThat(org.getSettings()).doesNotContainKey("customBranding");
    }

    @Test
    void updateOrgSettings_asMember_throwsAccessDenied() {
        assertThatThrownBy(() ->
                orgService.updateOrgSettings(ORG_ID, OrgRoles.ORG_MEMBER,
                        new UpdateOrgSettingsRequest(null, null, null, null, null, null, null)))
                .isInstanceOf(OrgAccessDeniedException.class);
    }

    @Test
    void updateOrgSettings_notFound_throwsOrgNotFoundException() {
        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                orgService.updateOrgSettings(ORG_ID, OrgRoles.ORG_ADMIN,
                        new UpdateOrgSettingsRequest(null, null, null, null, null, null, null)))
                .isInstanceOf(OrgNotFoundException.class);
    }

    // =========================================================================
    // transferOrgOwnership
    // =========================================================================

    @Test
    void transferOrgOwnership_asOwner_swapsRoles() {
        Organization org = buildOrg(ORG_ID, "acme", USER_ID);
        OrganizationMember currentOwner = ownerMember(ORG_ID, USER_ID);
        currentOwner.setOrgRole(OrgRoles.ORG_OWNER);
        OrganizationMember newOwner = ownerMember(ORG_ID, USER2_ID);
        newOwner.setOrgRole(OrgRoles.ORG_ADMIN);

        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.of(org));
        when(organizationMemberRepository.findAllByOrganization_IdAndUserId(ORG_ID, USER_ID))
                .thenReturn(Optional.of(currentOwner));
        when(organizationMemberRepository.findAllByOrganization_IdAndUserId(ORG_ID, USER2_ID))
                .thenReturn(Optional.of(newOwner));

        orgService.transferOrgOwnership(USER_ID, ORG_ID, OrgRoles.ORG_OWNER,
                new TransferOrgOwnershipRequest(USER2_ID));

        assertThat(currentOwner.getOrgRole()).isEqualTo(OrgRoles.ORG_ADMIN);
        assertThat(newOwner.getOrgRole()).isEqualTo(OrgRoles.ORG_OWNER);
        assertThat(org.getOwnerId()).isEqualTo(USER2_ID);
    }

    @Test
    void transferOrgOwnership_toSelf_throwsAccessDenied() {
        assertThatThrownBy(() ->
                orgService.transferOrgOwnership(USER_ID, ORG_ID, OrgRoles.ORG_OWNER,
                        new TransferOrgOwnershipRequest(USER_ID)))
                .isInstanceOf(OrgAccessDeniedException.class)
                .hasMessageContaining("yourself");
    }

    @Test
    void transferOrgOwnership_asAdmin_throwsAccessDenied() {
        assertThatThrownBy(() ->
                orgService.transferOrgOwnership(USER_ID, ORG_ID, OrgRoles.ORG_ADMIN,
                        new TransferOrgOwnershipRequest(USER2_ID)))
                .isInstanceOf(OrgAccessDeniedException.class);
    }

    @Test
    void transferOrgOwnership_orgNotFound_throwsOrgNotFoundException() {
        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                orgService.transferOrgOwnership(USER_ID, ORG_ID, OrgRoles.ORG_OWNER,
                        new TransferOrgOwnershipRequest(USER2_ID)))
                .isInstanceOf(OrgNotFoundException.class);
    }

    @Test
    void transferOrgOwnership_newOwnerNotMember_throwsAccessDenied() {
        Organization org = buildOrg(ORG_ID, "acme", USER_ID);
        OrganizationMember currentOwner = ownerMember(ORG_ID, USER_ID);

        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.of(org));
        when(organizationMemberRepository.findAllByOrganization_IdAndUserId(ORG_ID, USER_ID))
                .thenReturn(Optional.of(currentOwner));
        when(organizationMemberRepository.findAllByOrganization_IdAndUserId(ORG_ID, USER2_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                orgService.transferOrgOwnership(USER_ID, ORG_ID, OrgRoles.ORG_OWNER,
                        new TransferOrgOwnershipRequest(USER2_ID)))
                .isInstanceOf(OrgAccessDeniedException.class)
                .hasMessageContaining("member");
    }

    @Test
    void transferOrgOwnership_currentOwnerMemberNotFound_throwsAccessDenied() {
        Organization org = buildOrg(ORG_ID, "acme", USER_ID);

        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.of(org));
        when(organizationMemberRepository.findAllByOrganization_IdAndUserId(ORG_ID, USER_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                orgService.transferOrgOwnership(USER_ID, ORG_ID, OrgRoles.ORG_OWNER,
                        new TransferOrgOwnershipRequest(USER2_ID)))
                .isInstanceOf(OrgAccessDeniedException.class);
    }

    // =========================================================================
    // deleteOrg
    // =========================================================================

    @Test
    void deleteOrg_asOwner_deletesOrg() {
        Organization org = buildOrg(ORG_ID, "acme", USER_ID);
        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.of(org));

        orgService.deleteOrg(ORG_ID, OrgRoles.ORG_OWNER);

        verify(organizationRepository).delete(org);
    }

    @Test
    void deleteOrg_asAdmin_throwsAccessDenied() {
        assertThatThrownBy(() -> orgService.deleteOrg(ORG_ID, OrgRoles.ORG_ADMIN))
                .isInstanceOf(OrgAccessDeniedException.class);
    }

    @Test
    void deleteOrg_asMember_throwsAccessDenied() {
        assertThatThrownBy(() -> orgService.deleteOrg(ORG_ID, OrgRoles.ORG_MEMBER))
                .isInstanceOf(OrgAccessDeniedException.class);
    }

    @Test
    void deleteOrg_notFound_throwsOrgNotFoundException() {
        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orgService.deleteOrg(ORG_ID, OrgRoles.ORG_OWNER))
                .isInstanceOf(OrgNotFoundException.class);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private Organization buildOrg(UUID id, String slug, UUID ownerId) {
        return Organization.builder()
                .id(id).name("Acme Corp").slug(slug).ownerId(ownerId)
                .settings(new HashMap<>())
                .createdAt(Instant.now()).updatedAt(Instant.now())
                .build();
    }

    private OrganizationMember ownerMember(UUID orgId, UUID userId) {
        Organization stub = Organization.builder().id(orgId).build();
        return OrganizationMember.builder()
                .organization(stub).userId(userId).orgRole(OrgRoles.ORG_OWNER).build();
    }

    private OrgResponse orgResponse(UUID id, String slug) {
        return new OrgResponse(id, "Acme Corp", slug, null, null, null,
                OrgPlan.FREE, Map.of(), id, true, false, false,
                Instant.now(), Instant.now());
    }
}
