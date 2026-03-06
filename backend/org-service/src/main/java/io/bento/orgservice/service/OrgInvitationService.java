package io.bento.orgservice.service;

import io.bento.orgservice.dto.request.SendInvitationRequest;
import io.bento.orgservice.dto.response.InvitationResponse;
import io.bento.orgservice.dto.response.MemberResponse;
import io.bento.orgservice.entity.OrgInvitation;
import io.bento.orgservice.entity.Organization;
import io.bento.orgservice.entity.OrganizationMember;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.enums.Status;
import io.bento.orgservice.event.InvitationCreatedEvent;
import io.bento.orgservice.event.MemberJoinedEvent;
import io.bento.orgservice.event.OrgEventPublisher;
import io.bento.orgservice.exception.InvalidInvitationStatusException;
import io.bento.orgservice.exception.InvitationAlreadyExistsException;
import io.bento.orgservice.exception.InvitationExpiredException;
import io.bento.orgservice.exception.InvitationNotFoundException;
import io.bento.orgservice.exception.MemberAlreadyExistsException;
import io.bento.orgservice.exception.OrgAccessDeniedException;
import io.bento.orgservice.mapper.OrgInvitationMapper;
import io.bento.orgservice.mapper.OrgMemberMapper;
import io.bento.orgservice.repository.OrgInvitationRepository;
import io.bento.orgservice.repository.OrganizationMemberRepository;
import io.bento.orgservice.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrgInvitationService {

    private final OrganizationMemberRepository organizationMemberRepository;
    private final OrganizationRepository organizationRepository;
    private final OrgInvitationRepository orgInvitationRepository;
    private final OrgInvitationMapper orgInvitationMapper;
    private final OrgMemberMapper orgMemberMapper;
    private final OrgEventPublisher orgEventPublisher;

    @Transactional
    public InvitationResponse sentNewInvitation(UUID adminId, UUID orgId,
                                                OrgRoles callerRole, SendInvitationRequest invitationRequest) {
        if (!callerRole.isAtLeast(OrgRoles.ORG_ADMIN))
            throw new OrgAccessDeniedException("You are not allowed to send invitations for this organization");

        if (invitationRequest.orgRole().isHigherThan(callerRole))
            throw new OrgAccessDeniedException("You are not allowed to invite to a role higher than yours");

        Organization organization = organizationRepository.getReferenceById(orgId);

        if (orgInvitationRepository.existsByOrganization_IdAndEmailAndStatus(orgId, invitationRequest.email(), Status.PENDING))
            throw new InvitationAlreadyExistsException("Invitation has already been sent");

        OrgInvitation invitation = OrgInvitation.builder()
                .organization(organization)
                .email(invitationRequest.email())
                .orgRole(invitationRequest.orgRole())
                .token(UUID.randomUUID().toString())
                .invitedBy(adminId)
                .message(invitationRequest.message())
                .build();
        OrgInvitation savedInvitation = orgInvitationRepository.save(invitation);

        orgEventPublisher.publishInvitationCreated(new InvitationCreatedEvent(
                orgId,
                organization.getName(),
                adminId,
                savedInvitation.getEmail(),
                savedInvitation.getOrgRole(),
                savedInvitation.getToken(),
                savedInvitation.getExpiresAt().toString()
        ));

        return orgInvitationMapper.toInvitationResponse(savedInvitation);
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> getAllOrgActiveInitiation(UUID orgId, OrgRoles callerRole, Status status) {
        if (!callerRole.isAtLeast(OrgRoles.ORG_ADMIN))
            throw new OrgAccessDeniedException("You are not allowed to view invitations for this organization");

        if (status == null) {
            return orgInvitationRepository.findAllByOrganization_Id(orgId)
                    .stream().map(orgInvitationMapper::toInvitationResponse).toList();
        }
        return orgInvitationRepository.findAllByOrganization_IdAndStatus(orgId, status)
                .stream().map(orgInvitationMapper::toInvitationResponse).toList();
    }

    @Transactional
    public void deleteInvitation(UUID orgId, OrgRoles callerRole, UUID invitationId) {
        if (!callerRole.isAtLeast(OrgRoles.ORG_ADMIN))
            throw new OrgAccessDeniedException("You are not allowed to revoke invitations for this organization");

        OrgInvitation orgInvitation = orgInvitationRepository.findByIdAndOrganization_Id(invitationId, orgId)
                .orElseThrow(() -> new InvitationNotFoundException("Invitation not found"));

        if (!orgInvitation.getStatus().equals(Status.PENDING))
            throw new InvalidInvitationStatusException("Cannot revoke an invitation that is not pending");

        orgInvitation.setStatus(Status.REVOKED);
        orgInvitationRepository.save(orgInvitation);
    }

    // Public endpoint — token-based, no JWT org context, all DB checks are required
    @Transactional
    public MemberResponse acceptNewMember(UUID userId, String userEmail, String tokenInvitation) {
        OrgInvitation orgInvitation = orgInvitationRepository.findByEmailAndToken(userEmail, tokenInvitation)
                .orElseThrow(() -> new InvitationNotFoundException("Invitation not found"));

        if (!orgInvitation.getStatus().equals(Status.PENDING))
            throw new InvalidInvitationStatusException("Cannot accept an invitation that is not pending");

        if (orgInvitation.getExpiresAt().isBefore(Instant.now()))
            throw new InvitationExpiredException("Invitation has expired");

        if (organizationMemberRepository.existsByOrganization_IdAndUserId(orgInvitation.getOrganization().getId(), userId))
            throw new MemberAlreadyExistsException("You are already a member of this organization");

        orgInvitation.setStatus(Status.ACCEPTED);
        orgInvitation.setAcceptedAt(Instant.now());
        orgInvitationRepository.save(orgInvitation);

        Organization organization = organizationRepository.getReferenceById(orgInvitation.getOrganization().getId());
        OrganizationMember newMember = OrganizationMember.builder()
                .organization(organization)
                .userId(userId)
                .orgRole(orgInvitation.getOrgRole())
                .invitedBy(orgInvitation.getInvitedBy())
                .build();
        OrganizationMember savedMember = organizationMemberRepository.save(newMember);

        orgEventPublisher.publishMemberJoined(new MemberJoinedEvent(
                organization.getId(),
                organization.getName(),
                savedMember.getUserId(),
                savedMember.getOrgRole(),
                savedMember.getJoinedAt().toString()
        ));

        return orgMemberMapper.toMemberResponse(savedMember);
    }
}
