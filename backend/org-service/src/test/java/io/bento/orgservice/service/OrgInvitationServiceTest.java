package io.bento.orgservice.service;

import io.bento.kafka.event.InvitationCreatedEvent;
import io.bento.kafka.event.MemberJoinedEvent;
import io.bento.orgservice.dto.request.GenerateInviteLinkRequest;
import io.bento.orgservice.dto.request.SendInvitationRequest;
import io.bento.orgservice.dto.response.AcceptInvitationResponse;
import io.bento.orgservice.dto.response.InvitationPreviewResponse;
import io.bento.orgservice.dto.response.InvitationResponse;
import io.bento.orgservice.entity.OrgInvitation;
import io.bento.orgservice.entity.Organization;
import io.bento.orgservice.entity.OrganizationMember;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.enums.Status;
import io.bento.orgservice.event.OrgEventPublisher;
import io.bento.orgservice.exception.InvitationAlreadyExistsException;
import io.bento.orgservice.exception.InvitationExpiredException;
import io.bento.orgservice.exception.InvitationNotFoundException;
import io.bento.orgservice.exception.InvalidInvitationStatusException;
import io.bento.orgservice.exception.MemberAlreadyExistsException;
import io.bento.orgservice.exception.OrgAccessDeniedException;
import io.bento.orgservice.mapper.OrgInvitationMapper;
import io.bento.orgservice.repository.OrgInvitationRepository;
import io.bento.orgservice.repository.OrganizationMemberRepository;
import io.bento.orgservice.repository.OrganizationRepository;
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

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrgInvitationServiceTest {

    @Mock private OrganizationMemberRepository organizationMemberRepository;
    @Mock private OrganizationRepository organizationRepository;
    @Mock private OrgInvitationRepository orgInvitationRepository;
    @Mock private OrgInvitationMapper orgInvitationMapper;
    @Mock private OrgEventPublisher orgEventPublisher;

    @InjectMocks private OrgInvitationService orgInvitationService;

    private static final UUID ORG_ID   = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID ADMIN_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID USER_ID  = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final String TOKEN  = "test-token-abc";

    // =========================================================================
    // sendEmailInvitation
    // =========================================================================

    @Test
    void sendEmailInvitation_asMember_throwsAccessDenied() {
        assertThatThrownBy(() ->
                orgInvitationService.sendEmailInvitation(ADMIN_ID, ORG_ID, OrgRoles.ORG_MEMBER,
                        new SendInvitationRequest("user@example.com", OrgRoles.ORG_MEMBER, null)))
                .isInstanceOf(OrgAccessDeniedException.class);
    }

    @Test
    void sendEmailInvitation_roleHigherThanCaller_throwsAccessDenied() {
        // Admin tries to invite as OWNER
        assertThatThrownBy(() ->
                orgInvitationService.sendEmailInvitation(ADMIN_ID, ORG_ID, OrgRoles.ORG_ADMIN,
                        new SendInvitationRequest("user@example.com", OrgRoles.ORG_OWNER, null)))
                .isInstanceOf(OrgAccessDeniedException.class)
                .hasMessageContaining("higher");
    }

    @Test
    void sendEmailInvitation_duplicatePending_throwsAlreadyExists() {
        when(organizationRepository.getReferenceById(ORG_ID)).thenReturn(buildOrg());
        when(orgInvitationRepository.existsByOrganization_IdAndEmailAndStatus(
                ORG_ID, "user@example.com", Status.PENDING)).thenReturn(true);

        assertThatThrownBy(() ->
                orgInvitationService.sendEmailInvitation(ADMIN_ID, ORG_ID, OrgRoles.ORG_ADMIN,
                        new SendInvitationRequest("user@example.com", OrgRoles.ORG_MEMBER, null)))
                .isInstanceOf(InvitationAlreadyExistsException.class);
    }

    @Test
    void sendEmailInvitation_valid_savesInvitationAndPublishesEvent() {
        Organization org = buildOrg();
        OrgInvitation saved = buildInvitation("user@example.com", TOKEN, Status.PENDING, Instant.now().plusSeconds(86400));
        InvitationResponse response = invitationResponse(saved.getId());

        when(organizationRepository.getReferenceById(ORG_ID)).thenReturn(org);
        when(orgInvitationRepository.existsByOrganization_IdAndEmailAndStatus(any(), any(), any())).thenReturn(false);
        when(orgInvitationRepository.save(any())).thenReturn(saved);
        when(orgInvitationMapper.toInvitationResponse(saved)).thenReturn(response);

        InvitationResponse result = orgInvitationService.sendEmailInvitation(ADMIN_ID, ORG_ID, OrgRoles.ORG_ADMIN,
                new SendInvitationRequest("user@example.com", OrgRoles.ORG_MEMBER, "Welcome!"));

        assertThat(result).isEqualTo(response);
        verify(orgEventPublisher).publishInvitationCreated(any(InvitationCreatedEvent.class));
    }

    @Test
    void sendEmailInvitation_invitationHasCorrectFields() {
        Organization org = buildOrg();
        OrgInvitation saved = buildInvitation("user@example.com", TOKEN, Status.PENDING, Instant.now().plusSeconds(86400));

        when(organizationRepository.getReferenceById(ORG_ID)).thenReturn(org);
        when(orgInvitationRepository.existsByOrganization_IdAndEmailAndStatus(any(), any(), any())).thenReturn(false);
        when(orgInvitationRepository.save(any())).thenReturn(saved);
        when(orgInvitationMapper.toInvitationResponse(any())).thenReturn(invitationResponse(saved.getId()));

        orgInvitationService.sendEmailInvitation(ADMIN_ID, ORG_ID, OrgRoles.ORG_ADMIN,
                new SendInvitationRequest("user@example.com", OrgRoles.ORG_MEMBER, "msg"));

        ArgumentCaptor<OrgInvitation> captor = ArgumentCaptor.forClass(OrgInvitation.class);
        verify(orgInvitationRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isEqualTo("user@example.com");
        assertThat(captor.getValue().getOrgRole()).isEqualTo(OrgRoles.ORG_MEMBER);
        assertThat(captor.getValue().getInvitedBy()).isEqualTo(ADMIN_ID);
        assertThat(captor.getValue().getMessage()).isEqualTo("msg");
    }

    // =========================================================================
    // generateOpenInviteLink
    // =========================================================================

    @Test
    void generateOpenInviteLink_asMember_throwsAccessDenied() {
        assertThatThrownBy(() ->
                orgInvitationService.generateOpenInviteLink(ADMIN_ID, ORG_ID, OrgRoles.ORG_MEMBER,
                        new GenerateInviteLinkRequest(OrgRoles.ORG_MEMBER)))
                .isInstanceOf(OrgAccessDeniedException.class);
    }

    @Test
    void generateOpenInviteLink_roleHigherThanCaller_throwsAccessDenied() {
        assertThatThrownBy(() ->
                orgInvitationService.generateOpenInviteLink(ADMIN_ID, ORG_ID, OrgRoles.ORG_ADMIN,
                        new GenerateInviteLinkRequest(OrgRoles.ORG_OWNER)))
                .isInstanceOf(OrgAccessDeniedException.class);
    }

    @Test
    void generateOpenInviteLink_valid_emailIsNull() {
        Organization org = buildOrg();
        OrgInvitation saved = buildInvitation(null, TOKEN, Status.PENDING, Instant.now().plusSeconds(86400));

        when(organizationRepository.getReferenceById(ORG_ID)).thenReturn(org);
        when(orgInvitationRepository.save(any())).thenReturn(saved);
        when(orgInvitationMapper.toInvitationResponse(saved)).thenReturn(invitationResponse(saved.getId()));

        orgInvitationService.generateOpenInviteLink(ADMIN_ID, ORG_ID, OrgRoles.ORG_ADMIN,
                new GenerateInviteLinkRequest(OrgRoles.ORG_MEMBER));

        ArgumentCaptor<OrgInvitation> captor = ArgumentCaptor.forClass(OrgInvitation.class);
        verify(orgInvitationRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isNull();
    }

    // =========================================================================
    // getInvitationPreview
    // =========================================================================

    @Test
    void getInvitationPreview_tokenNotFound_throwsNotFound() {
        when(orgInvitationRepository.findByToken(TOKEN)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orgInvitationService.getInvitationPreview(TOKEN))
                .isInstanceOf(InvitationNotFoundException.class);
    }

    @Test
    void getInvitationPreview_notPending_throwsInvalidStatus() {
        OrgInvitation inv = buildInvitation("user@example.com", TOKEN, Status.ACCEPTED, Instant.now().plusSeconds(86400));
        when(orgInvitationRepository.findByToken(TOKEN)).thenReturn(Optional.of(inv));

        assertThatThrownBy(() -> orgInvitationService.getInvitationPreview(TOKEN))
                .isInstanceOf(InvalidInvitationStatusException.class);
    }

    @Test
    void getInvitationPreview_expired_throwsExpired() {
        OrgInvitation inv = buildInvitation("user@example.com", TOKEN, Status.PENDING, Instant.now().minusSeconds(1));
        when(orgInvitationRepository.findByToken(TOKEN)).thenReturn(Optional.of(inv));

        assertThatThrownBy(() -> orgInvitationService.getInvitationPreview(TOKEN))
                .isInstanceOf(InvitationExpiredException.class);
    }

    @Test
    void getInvitationPreview_valid_returnsPreview() {
        OrgInvitation inv = buildInvitation("user@example.com", TOKEN, Status.PENDING, Instant.now().plusSeconds(86400));
        when(orgInvitationRepository.findByToken(TOKEN)).thenReturn(Optional.of(inv));

        InvitationPreviewResponse result = orgInvitationService.getInvitationPreview(TOKEN);

        assertThat(result.orgId()).isEqualTo(ORG_ID);
        assertThat(result.orgName()).isEqualTo("Acme Corp");
        assertThat(result.role()).isEqualTo(OrgRoles.ORG_MEMBER);
    }

    @Test
    void getInvitationPreview_emailInvite_isEmailProtectedTrue() {
        OrgInvitation inv = buildInvitation("user@example.com", TOKEN, Status.PENDING, Instant.now().plusSeconds(86400));
        when(orgInvitationRepository.findByToken(TOKEN)).thenReturn(Optional.of(inv));

        InvitationPreviewResponse result = orgInvitationService.getInvitationPreview(TOKEN);

        assertThat(result.isEmailProtected()).isTrue();
    }

    @Test
    void getInvitationPreview_openLink_isEmailProtectedFalse() {
        OrgInvitation inv = buildInvitation(null, TOKEN, Status.PENDING, Instant.now().plusSeconds(86400));
        when(orgInvitationRepository.findByToken(TOKEN)).thenReturn(Optional.of(inv));

        InvitationPreviewResponse result = orgInvitationService.getInvitationPreview(TOKEN);

        assertThat(result.isEmailProtected()).isFalse();
    }

    // =========================================================================
    // acceptInvitation
    // =========================================================================

    @Test
    void acceptInvitation_tokenNotFound_throwsNotFound() {
        when(orgInvitationRepository.findByToken(TOKEN)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                orgInvitationService.acceptInvitation(USER_ID, "user@example.com", TOKEN))
                .isInstanceOf(InvitationNotFoundException.class);
    }

    @Test
    void acceptInvitation_emailMismatch_throwsNotFound() {
        OrgInvitation inv = buildInvitation("owner@example.com", TOKEN, Status.PENDING, Instant.now().plusSeconds(86400));
        when(orgInvitationRepository.findByToken(TOKEN)).thenReturn(Optional.of(inv));

        assertThatThrownBy(() ->
                orgInvitationService.acceptInvitation(USER_ID, "other@example.com", TOKEN))
                .isInstanceOf(InvitationNotFoundException.class);
    }

    @Test
    void acceptInvitation_emailMatchIgnoresCase() {
        OrgInvitation inv = buildInvitation("User@Example.COM", TOKEN, Status.PENDING, Instant.now().plusSeconds(86400));
        Organization org = buildOrg();

        when(orgInvitationRepository.findByToken(TOKEN)).thenReturn(Optional.of(inv));
        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.of(org));
        when(organizationMemberRepository.existsByOrganization_IdAndUserId(ORG_ID, USER_ID)).thenReturn(false);
        when(organizationMemberRepository.save(any())).thenReturn(buildMember());

        assertThatCode(() ->
                orgInvitationService.acceptInvitation(USER_ID, "user@example.com", TOKEN))
                .doesNotThrowAnyException();
    }

    @Test
    void acceptInvitation_notPending_throwsInvalidStatus() {
        OrgInvitation inv = buildInvitation("user@example.com", TOKEN, Status.REVOKED, Instant.now().plusSeconds(86400));
        when(orgInvitationRepository.findByToken(TOKEN)).thenReturn(Optional.of(inv));

        assertThatThrownBy(() ->
                orgInvitationService.acceptInvitation(USER_ID, "user@example.com", TOKEN))
                .isInstanceOf(InvalidInvitationStatusException.class);
    }

    @Test
    void acceptInvitation_expired_throwsExpired() {
        OrgInvitation inv = buildInvitation("user@example.com", TOKEN, Status.PENDING, Instant.now().minusSeconds(1));
        when(orgInvitationRepository.findByToken(TOKEN)).thenReturn(Optional.of(inv));

        assertThatThrownBy(() ->
                orgInvitationService.acceptInvitation(USER_ID, "user@example.com", TOKEN))
                .isInstanceOf(InvitationExpiredException.class);
    }

    @Test
    void acceptInvitation_alreadyMember_throwsMemberAlreadyExists() {
        OrgInvitation inv = buildInvitation("user@example.com", TOKEN, Status.PENDING, Instant.now().plusSeconds(86400));
        when(orgInvitationRepository.findByToken(TOKEN)).thenReturn(Optional.of(inv));
        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.of(buildOrg()));
        when(organizationMemberRepository.existsByOrganization_IdAndUserId(ORG_ID, USER_ID)).thenReturn(true);

        assertThatThrownBy(() ->
                orgInvitationService.acceptInvitation(USER_ID, "user@example.com", TOKEN))
                .isInstanceOf(MemberAlreadyExistsException.class);
    }

    @Test
    void acceptInvitation_emailInvite_setsStatusAccepted() {
        OrgInvitation inv = buildInvitation("user@example.com", TOKEN, Status.PENDING, Instant.now().plusSeconds(86400));
        when(orgInvitationRepository.findByToken(TOKEN)).thenReturn(Optional.of(inv));
        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.of(buildOrg()));
        when(organizationMemberRepository.existsByOrganization_IdAndUserId(ORG_ID, USER_ID)).thenReturn(false);
        when(organizationMemberRepository.save(any())).thenReturn(buildMember());

        orgInvitationService.acceptInvitation(USER_ID, "user@example.com", TOKEN);

        assertThat(inv.getStatus()).isEqualTo(Status.ACCEPTED);
        assertThat(inv.getAcceptedAt()).isNotNull();
        verify(orgInvitationRepository).save(inv);
    }

    @Test
    void acceptInvitation_openLink_staysPending() {
        // email is null → open link, should NOT change status
        OrgInvitation inv = buildInvitation(null, TOKEN, Status.PENDING, Instant.now().plusSeconds(86400));
        when(orgInvitationRepository.findByToken(TOKEN)).thenReturn(Optional.of(inv));
        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.of(buildOrg()));
        when(organizationMemberRepository.existsByOrganization_IdAndUserId(ORG_ID, USER_ID)).thenReturn(false);
        when(organizationMemberRepository.save(any())).thenReturn(buildMember());

        orgInvitationService.acceptInvitation(USER_ID, "any@example.com", TOKEN);

        assertThat(inv.getStatus()).isEqualTo(Status.PENDING);
        verify(orgInvitationRepository, never()).save(inv);
    }

    @Test
    void acceptInvitation_publishesMemberJoinedEvent() {
        OrgInvitation inv = buildInvitation(null, TOKEN, Status.PENDING, Instant.now().plusSeconds(86400));
        Organization org = buildOrg();
        OrganizationMember saved = buildMember();

        when(orgInvitationRepository.findByToken(TOKEN)).thenReturn(Optional.of(inv));
        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.of(org));
        when(organizationMemberRepository.existsByOrganization_IdAndUserId(ORG_ID, USER_ID)).thenReturn(false);
        when(organizationMemberRepository.save(any())).thenReturn(saved);

        orgInvitationService.acceptInvitation(USER_ID, "any@example.com", TOKEN);

        ArgumentCaptor<MemberJoinedEvent> captor = ArgumentCaptor.forClass(MemberJoinedEvent.class);
        verify(orgEventPublisher).publishMemberJoined(captor.capture());
        assertThat(captor.getValue().orgId()).isEqualTo(ORG_ID);
    }

    @Test
    void acceptInvitation_returnsCorrectResponse() {
        OrgInvitation inv = buildInvitation(null, TOKEN, Status.PENDING, Instant.now().plusSeconds(86400));
        Organization org = buildOrg();
        OrganizationMember saved = buildMember();

        when(orgInvitationRepository.findByToken(TOKEN)).thenReturn(Optional.of(inv));
        when(organizationRepository.findById(ORG_ID)).thenReturn(Optional.of(org));
        when(organizationMemberRepository.existsByOrganization_IdAndUserId(ORG_ID, USER_ID)).thenReturn(false);
        when(organizationMemberRepository.save(any())).thenReturn(saved);

        AcceptInvitationResponse result = orgInvitationService.acceptInvitation(USER_ID, "any@example.com", TOKEN);

        assertThat(result.orgId()).isEqualTo(ORG_ID);
        assertThat(result.orgSlug()).isEqualTo("acme");
        assertThat(result.orgRole()).isEqualTo(OrgRoles.ORG_MEMBER);
    }

    // =========================================================================
    // getAllOrgInvitations
    // =========================================================================

    @Test
    void getAllOrgInvitations_asMember_throwsAccessDenied() {
        assertThatThrownBy(() ->
                orgInvitationService.getAllOrgInvitations(ORG_ID, OrgRoles.ORG_MEMBER, null))
                .isInstanceOf(OrgAccessDeniedException.class);
    }

    @Test
    void getAllOrgInvitations_nullStatus_returnsAll() {
        OrgInvitation inv = buildInvitation("user@example.com", TOKEN, Status.PENDING, Instant.now().plusSeconds(86400));
        when(orgInvitationRepository.findAllByOrganization_Id(ORG_ID)).thenReturn(List.of(inv));
        when(orgInvitationMapper.toInvitationResponse(inv)).thenReturn(invitationResponse(inv.getId()));

        List<InvitationResponse> result = orgInvitationService.getAllOrgInvitations(ORG_ID, OrgRoles.ORG_ADMIN, null);

        assertThat(result).hasSize(1);
        verify(orgInvitationRepository).findAllByOrganization_Id(ORG_ID);
    }

    @Test
    void getAllOrgInvitations_withStatus_filtersByStatus() {
        OrgInvitation inv = buildInvitation("user@example.com", TOKEN, Status.PENDING, Instant.now().plusSeconds(86400));
        when(orgInvitationRepository.findAllByOrganization_IdAndStatus(ORG_ID, Status.PENDING)).thenReturn(List.of(inv));
        when(orgInvitationMapper.toInvitationResponse(inv)).thenReturn(invitationResponse(inv.getId()));

        List<InvitationResponse> result =
                orgInvitationService.getAllOrgInvitations(ORG_ID, OrgRoles.ORG_ADMIN, Status.PENDING);

        assertThat(result).hasSize(1);
        verify(orgInvitationRepository).findAllByOrganization_IdAndStatus(ORG_ID, Status.PENDING);
    }

    // =========================================================================
    // deleteInvitation
    // =========================================================================

    @Test
    void deleteInvitation_asMember_throwsAccessDenied() {
        assertThatThrownBy(() ->
                orgInvitationService.deleteInvitation(ORG_ID, OrgRoles.ORG_MEMBER, UUID.randomUUID()))
                .isInstanceOf(OrgAccessDeniedException.class);
    }

    @Test
    void deleteInvitation_notFound_throwsNotFound() {
        UUID invId = UUID.randomUUID();
        when(orgInvitationRepository.findByIdAndOrganization_Id(invId, ORG_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                orgInvitationService.deleteInvitation(ORG_ID, OrgRoles.ORG_ADMIN, invId))
                .isInstanceOf(InvitationNotFoundException.class);
    }

    @Test
    void deleteInvitation_notPending_throwsInvalidStatus() {
        UUID invId = UUID.randomUUID();
        OrgInvitation inv = buildInvitation("user@example.com", TOKEN, Status.ACCEPTED, Instant.now().plusSeconds(86400));
        when(orgInvitationRepository.findByIdAndOrganization_Id(invId, ORG_ID)).thenReturn(Optional.of(inv));

        assertThatThrownBy(() ->
                orgInvitationService.deleteInvitation(ORG_ID, OrgRoles.ORG_ADMIN, invId))
                .isInstanceOf(InvalidInvitationStatusException.class);
    }

    @Test
    void deleteInvitation_valid_setsRevoked() {
        UUID invId = UUID.randomUUID();
        OrgInvitation inv = buildInvitation("user@example.com", TOKEN, Status.PENDING, Instant.now().plusSeconds(86400));
        when(orgInvitationRepository.findByIdAndOrganization_Id(invId, ORG_ID)).thenReturn(Optional.of(inv));

        orgInvitationService.deleteInvitation(ORG_ID, OrgRoles.ORG_ADMIN, invId);

        assertThat(inv.getStatus()).isEqualTo(Status.REVOKED);
        verify(orgInvitationRepository).save(inv);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private Organization buildOrg() {
        return Organization.builder()
                .id(ORG_ID).name("Acme Corp").slug("acme").ownerId(ADMIN_ID).build();
    }

    private OrgInvitation buildInvitation(String email, String token, Status status, Instant expiresAt) {
        Organization org = buildOrg();
        return OrgInvitation.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .email(email)
                .orgRole(OrgRoles.ORG_MEMBER)
                .token(token)
                .invitedBy(ADMIN_ID)
                .status(status)
                .expiresAt(expiresAt)
                .build();
    }

    private OrganizationMember buildMember() {
        Organization org = buildOrg();
        return OrganizationMember.builder()
                .organization(org)
                .userId(USER_ID)
                .orgRole(OrgRoles.ORG_MEMBER)
                .invitedBy(ADMIN_ID)
                .joinedAt(Instant.now())
                .build();
    }

    private InvitationResponse invitationResponse(UUID id) {
        return new InvitationResponse(id, "user@example.com", OrgRoles.ORG_MEMBER, Status.PENDING,
                ADMIN_ID, Instant.now().plusSeconds(86400), Instant.now(), TOKEN);
    }
}
