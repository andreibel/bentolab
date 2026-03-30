package io.bento.orgservice.service;

import io.bento.kafka.event.MemberRemovedEvent;
import io.bento.kafka.event.MemberRoleChangedEvent;
import io.bento.orgservice.dto.request.UpdateMemberRoleRequest;
import io.bento.orgservice.dto.response.MemberResponse;
import io.bento.orgservice.entity.Organization;
import io.bento.orgservice.entity.OrganizationMember;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.event.OrgEventPublisher;
import io.bento.orgservice.exception.OrgAccessDeniedException;
import io.bento.orgservice.exception.OrganizationMemberNotFoundException;
import io.bento.orgservice.mapper.OrgMemberMapper;
import io.bento.orgservice.repository.OrganizationMemberRepository;
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
class MemberServiceTest {

    @Mock private OrganizationMemberRepository organizationMemberRepository;
    @Mock private OrgMemberMapper orgMemberMapper;
    @Mock private OrgEventPublisher orgEventPublisher;

    @InjectMocks private MemberService memberService;

    private static final UUID ORG_ID    = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID ADMIN_ID  = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID MEMBER_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");

    // =========================================================================
    // getAllOrgMember
    // =========================================================================

    @Test
    void getAllOrgMember_returnsMappedMembers() {
        OrganizationMember m1 = buildMember(ADMIN_ID, OrgRoles.ORG_ADMIN);
        OrganizationMember m2 = buildMember(MEMBER_ID, OrgRoles.ORG_MEMBER);
        MemberResponse r1 = memberResponse(ADMIN_ID, OrgRoles.ORG_ADMIN);
        MemberResponse r2 = memberResponse(MEMBER_ID, OrgRoles.ORG_MEMBER);

        when(organizationMemberRepository.findAllByOrganization_Id(ORG_ID)).thenReturn(List.of(m1, m2));
        when(orgMemberMapper.toMemberResponse(m1)).thenReturn(r1);
        when(orgMemberMapper.toMemberResponse(m2)).thenReturn(r2);

        List<MemberResponse> result = memberService.getAllOrgMember(ORG_ID);

        assertThat(result).hasSize(2);
        assertThat(result).containsExactly(r1, r2);
    }

    @Test
    void getAllOrgMember_noMembers_returnsEmpty() {
        when(organizationMemberRepository.findAllByOrganization_Id(ORG_ID)).thenReturn(List.of());

        assertThat(memberService.getAllOrgMember(ORG_ID)).isEmpty();
    }

    // =========================================================================
    // updateMemberRole
    // =========================================================================

    @Test
    void updateMemberRole_asAdmin_promoteMemberToAdmin_succeeds() {
        OrganizationMember target = buildMember(MEMBER_ID, OrgRoles.ORG_MEMBER);
        MemberResponse response = memberResponse(MEMBER_ID, OrgRoles.ORG_ADMIN);

        when(organizationMemberRepository.findAllByOrganization_IdAndUserId(ORG_ID, MEMBER_ID))
                .thenReturn(Optional.of(target));
        when(organizationMemberRepository.save(target)).thenReturn(target);
        when(orgMemberMapper.toMemberResponse(target)).thenReturn(response);

        MemberResponse result = memberService.updateMemberRole(ADMIN_ID, MEMBER_ID, ORG_ID,
                OrgRoles.ORG_OWNER, new UpdateMemberRoleRequest(OrgRoles.ORG_ADMIN));

        assertThat(target.getOrgRole()).isEqualTo(OrgRoles.ORG_ADMIN);
    }

    @Test
    void updateMemberRole_asMember_throwsAccessDenied() {
        assertThatThrownBy(() ->
                memberService.updateMemberRole(ADMIN_ID, MEMBER_ID, ORG_ID,
                        OrgRoles.ORG_MEMBER, new UpdateMemberRoleRequest(OrgRoles.ORG_MEMBER)))
                .isInstanceOf(OrgAccessDeniedException.class);
    }

    @Test
    void updateMemberRole_promoteAboveCaller_throwsAccessDenied() {
        // Admin tries to promote someone to OWNER (higher than ADMIN)
        assertThatThrownBy(() ->
                memberService.updateMemberRole(ADMIN_ID, MEMBER_ID, ORG_ID,
                        OrgRoles.ORG_ADMIN, new UpdateMemberRoleRequest(OrgRoles.ORG_OWNER)))
                .isInstanceOf(OrgAccessDeniedException.class)
                .hasMessageContaining("higher");
    }

    @Test
    void updateMemberRole_changeOwnerRole_throwsAccessDenied() {
        OrganizationMember ownerTarget = buildMember(MEMBER_ID, OrgRoles.ORG_OWNER);

        when(organizationMemberRepository.findAllByOrganization_IdAndUserId(ORG_ID, MEMBER_ID))
                .thenReturn(Optional.of(ownerTarget));

        assertThatThrownBy(() ->
                memberService.updateMemberRole(ADMIN_ID, MEMBER_ID, ORG_ID,
                        OrgRoles.ORG_OWNER, new UpdateMemberRoleRequest(OrgRoles.ORG_ADMIN)))
                .isInstanceOf(OrgAccessDeniedException.class)
                .hasMessageContaining("owner");
    }

    @Test
    void updateMemberRole_memberNotFound_throwsMemberNotFoundException() {
        when(organizationMemberRepository.findAllByOrganization_IdAndUserId(ORG_ID, MEMBER_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                memberService.updateMemberRole(ADMIN_ID, MEMBER_ID, ORG_ID,
                        OrgRoles.ORG_ADMIN, new UpdateMemberRoleRequest(OrgRoles.ORG_ADMIN)))
                .isInstanceOf(OrganizationMemberNotFoundException.class);
    }

    @Test
    void updateMemberRole_publishesMemberRoleChangedEvent() {
        OrganizationMember target = buildMember(MEMBER_ID, OrgRoles.ORG_MEMBER);
        when(organizationMemberRepository.findAllByOrganization_IdAndUserId(ORG_ID, MEMBER_ID))
                .thenReturn(Optional.of(target));
        when(organizationMemberRepository.save(target)).thenReturn(target);
        when(orgMemberMapper.toMemberResponse(target)).thenReturn(memberResponse(MEMBER_ID, OrgRoles.ORG_ADMIN));

        memberService.updateMemberRole(ADMIN_ID, MEMBER_ID, ORG_ID,
                OrgRoles.ORG_ADMIN, new UpdateMemberRoleRequest(OrgRoles.ORG_ADMIN));

        ArgumentCaptor<MemberRoleChangedEvent> captor = ArgumentCaptor.forClass(MemberRoleChangedEvent.class);
        verify(orgEventPublisher).publishMemberRoleChanged(captor.capture());
        assertThat(captor.getValue().orgId()).isEqualTo(ORG_ID);
        assertThat(captor.getValue().userId()).isEqualTo(MEMBER_ID);
        assertThat(captor.getValue().newRole()).isEqualTo(OrgRoles.ORG_ADMIN.name());
    }

    // =========================================================================
    // deleteMember
    // =========================================================================

    @Test
    void deleteMember_selfLeaveMember_succeeds() {
        OrganizationMember self = buildMember(MEMBER_ID, OrgRoles.ORG_MEMBER);
        when(organizationMemberRepository.findAllByOrganization_IdAndUserId(ORG_ID, MEMBER_ID))
                .thenReturn(Optional.of(self));

        // Member deletes themselves (isSelfDelete = true, canDeleteOther = false)
        memberService.deleteMember(MEMBER_ID, MEMBER_ID, ORG_ID, OrgRoles.ORG_MEMBER);

        verify(organizationMemberRepository).delete(self);
    }

    @Test
    void deleteMember_adminDeletesMember_succeeds() {
        OrganizationMember target = buildMember(MEMBER_ID, OrgRoles.ORG_MEMBER);
        when(organizationMemberRepository.findAllByOrganization_IdAndUserId(ORG_ID, MEMBER_ID))
                .thenReturn(Optional.of(target));

        memberService.deleteMember(ADMIN_ID, MEMBER_ID, ORG_ID, OrgRoles.ORG_ADMIN);

        verify(organizationMemberRepository).delete(target);
    }

    @Test
    void deleteMember_adminDeletesAdmin_throwsAccessDenied() {
        // Admin (rank 1) tries to delete another admin (rank 1) — not higher, not self
        OrganizationMember target = buildMember(MEMBER_ID, OrgRoles.ORG_ADMIN);
        when(organizationMemberRepository.findAllByOrganization_IdAndUserId(ORG_ID, MEMBER_ID))
                .thenReturn(Optional.of(target));

        assertThatThrownBy(() ->
                memberService.deleteMember(ADMIN_ID, MEMBER_ID, ORG_ID, OrgRoles.ORG_ADMIN))
                .isInstanceOf(OrgAccessDeniedException.class);
    }

    @Test
    void deleteMember_memberTriesToDeleteOther_throwsAccessDenied() {
        UUID otherId = UUID.randomUUID();
        OrganizationMember target = buildMember(otherId, OrgRoles.ORG_MEMBER);
        when(organizationMemberRepository.findAllByOrganization_IdAndUserId(ORG_ID, otherId))
                .thenReturn(Optional.of(target));

        // MEMBER_ID is not ADMIN, not OWNER, not same as otherId
        assertThatThrownBy(() ->
                memberService.deleteMember(MEMBER_ID, otherId, ORG_ID, OrgRoles.ORG_MEMBER))
                .isInstanceOf(OrgAccessDeniedException.class);
    }

    @Test
    void deleteMember_ownerSelfDelete_throwsAccessDenied() {
        // Owner self-delete: isSelfDelete = (adminId == userId && callerRole != OWNER) → false because callerRole IS OWNER
        // canDeleteOther = ORG_OWNER.isHigherThan(ORG_OWNER) = false
        // So neither condition is true → throw
        UUID ownerId = UUID.fromString("00000000-0000-0000-0000-000000000099");
        OrganizationMember ownerMember = buildMember(ownerId, OrgRoles.ORG_OWNER);
        when(organizationMemberRepository.findAllByOrganization_IdAndUserId(ORG_ID, ownerId))
                .thenReturn(Optional.of(ownerMember));

        assertThatThrownBy(() ->
                memberService.deleteMember(ownerId, ownerId, ORG_ID, OrgRoles.ORG_OWNER))
                .isInstanceOf(OrgAccessDeniedException.class);
    }

    @Test
    void deleteMember_memberNotFound_throwsMemberNotFoundException() {
        when(organizationMemberRepository.findAllByOrganization_IdAndUserId(ORG_ID, MEMBER_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                memberService.deleteMember(ADMIN_ID, MEMBER_ID, ORG_ID, OrgRoles.ORG_ADMIN))
                .isInstanceOf(OrganizationMemberNotFoundException.class);
    }

    @Test
    void deleteMember_publishesMemberRemovedEvent() {
        OrganizationMember target = buildMember(MEMBER_ID, OrgRoles.ORG_MEMBER);
        when(organizationMemberRepository.findAllByOrganization_IdAndUserId(ORG_ID, MEMBER_ID))
                .thenReturn(Optional.of(target));

        memberService.deleteMember(ADMIN_ID, MEMBER_ID, ORG_ID, OrgRoles.ORG_ADMIN);

        ArgumentCaptor<MemberRemovedEvent> captor = ArgumentCaptor.forClass(MemberRemovedEvent.class);
        verify(orgEventPublisher).publishMemberRemoved(captor.capture());
        assertThat(captor.getValue().orgId()).isEqualTo(ORG_ID);
        assertThat(captor.getValue().userId()).isEqualTo(MEMBER_ID);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private OrganizationMember buildMember(UUID userId, OrgRoles role) {
        Organization org = Organization.builder().id(ORG_ID).build();
        return OrganizationMember.builder()
                .organization(org).userId(userId).orgRole(role).joinedAt(Instant.now()).build();
    }

    private MemberResponse memberResponse(UUID userId, OrgRoles role) {
        return new MemberResponse(userId, role, null, Instant.now());
    }
}
