package io.bento.orgservice.service;

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
import io.bento.kafka.event.InvitationCreatedEvent;
import io.bento.kafka.event.MemberJoinedEvent;
import io.bento.orgservice.event.OrgEventPublisher;
import io.bento.orgservice.exception.InvalidInvitationStatusException;
import io.bento.orgservice.exception.InvitationAlreadyExistsException;
import io.bento.orgservice.exception.InvitationExpiredException;
import io.bento.orgservice.exception.InvitationNotFoundException;
import io.bento.orgservice.exception.MemberAlreadyExistsException;
import io.bento.orgservice.exception.OrgAccessDeniedException;
import io.bento.orgservice.mapper.OrgInvitationMapper;
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
    private final OrgEventPublisher orgEventPublisher;

    // ── Send email-specific invitation ────────────────────────────────────────

    @Transactional
    public InvitationResponse sendEmailInvitation(UUID adminId, UUID orgId,
                                                  OrgRoles callerRole, SendInvitationRequest request) {
        if (!callerRole.isAtLeast(OrgRoles.ORG_ADMIN))
            throw new OrgAccessDeniedException("You are not allowed to send invitations");

        if (request.orgRole().isHigherThan(callerRole))
            throw new OrgAccessDeniedException("You cannot invite to a role higher than your own");

        Organization organization = organizationRepository.getReferenceById(orgId);

        if (orgInvitationRepository.existsByOrganization_IdAndEmailAndStatus(orgId, request.email(), Status.PENDING))
            throw new InvitationAlreadyExistsException("A pending invitation for this email already exists");

        OrgInvitation invitation = OrgInvitation.builder()
                .organization(organization)
                .email(request.email())
                .orgRole(request.orgRole())
                .token(UUID.randomUUID().toString())
                .invitedBy(adminId)
                .message(request.message())
                .build();
        OrgInvitation saved = orgInvitationRepository.save(invitation);

        orgEventPublisher.publishInvitationCreated(new InvitationCreatedEvent(
                orgId,
                organization.getName(),
                adminId,
                saved.getEmail(),
                saved.getOrgRole().name(),
                saved.getToken(),
                saved.getExpiresAt().toString()
        ));

        return orgInvitationMapper.toInvitationResponse(saved);
    }

    // ── Generate open invite link (no email restriction) ─────────────────────

    @Transactional
    public InvitationResponse generateOpenInviteLink(UUID adminId, UUID orgId,
                                                     OrgRoles callerRole, GenerateInviteLinkRequest request) {
        if (!callerRole.isAtLeast(OrgRoles.ORG_ADMIN))
            throw new OrgAccessDeniedException("You are not allowed to generate invite links");

        if (request.orgRole().isHigherThan(callerRole))
            throw new OrgAccessDeniedException("You cannot invite to a role higher than your own");

        Organization organization = organizationRepository.getReferenceById(orgId);

        OrgInvitation invitation = OrgInvitation.builder()
                .organization(organization)
                .email(null)            // open link — no email restriction
                .orgRole(request.orgRole())
                .token(UUID.randomUUID().toString())
                .invitedBy(adminId)
                .build();
        OrgInvitation saved = orgInvitationRepository.save(invitation);

        return orgInvitationMapper.toInvitationResponse(saved);
    }

    // ── Public preview (no JWT) ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public InvitationPreviewResponse getInvitationPreview(String token) {
        OrgInvitation invitation = orgInvitationRepository.findByToken(token)
                .orElseThrow(() -> new InvitationNotFoundException("Invitation not found"));

        if (!invitation.getStatus().equals(Status.PENDING))
            throw new InvalidInvitationStatusException("This invitation is no longer active");

        if (invitation.getExpiresAt().isBefore(Instant.now()))
            throw new InvitationExpiredException("This invitation has expired");

        Organization org = invitation.getOrganization();
        return new InvitationPreviewResponse(
                org.getId(),
                org.getName(),
                org.getSlug(),
                invitation.getOrgRole(),
                invitation.getEmail() != null,
                invitation.getExpiresAt()
        );
    }

    // ── Accept invitation ─────────────────────────────────────────────────────

    @Transactional
    public AcceptInvitationResponse acceptInvitation(UUID userId, String userEmail, String token) {
        OrgInvitation invitation = orgInvitationRepository.findByToken(token)
                .orElseThrow(() -> new InvitationNotFoundException("Invitation not found"));

        // Email-protected invites: the caller's email must match exactly
        if (invitation.getEmail() != null && !invitation.getEmail().equalsIgnoreCase(userEmail)) {
            throw new InvitationNotFoundException("Invitation not found");  // don't leak info
        }

        if (!invitation.getStatus().equals(Status.PENDING))
            throw new InvalidInvitationStatusException("This invitation is no longer active");

        if (invitation.getExpiresAt().isBefore(Instant.now()))
            throw new InvitationExpiredException("This invitation has expired");

        Organization org = organizationRepository.findById(invitation.getOrganization().getId())
                .orElseThrow(() -> new InvitationNotFoundException("Organization not found"));

        if (organizationMemberRepository.existsByOrganization_IdAndUserId(org.getId(), userId))
            throw new MemberAlreadyExistsException("You are already a member of this organization");

        // Email invites are single-use; open links stay PENDING so multiple people can accept
        if (invitation.getEmail() != null) {
            invitation.setStatus(Status.ACCEPTED);
            invitation.setAcceptedAt(Instant.now());
            orgInvitationRepository.save(invitation);
        }

        OrganizationMember newMember = OrganizationMember.builder()
                .organization(org)
                .userId(userId)
                .orgRole(invitation.getOrgRole())
                .invitedBy(invitation.getInvitedBy())
                .build();
        OrganizationMember saved = organizationMemberRepository.save(newMember);

        orgEventPublisher.publishMemberJoined(new MemberJoinedEvent(
                org.getId(),
                org.getName(),
                saved.getUserId(),
                saved.getOrgRole().name(),
                saved.getJoinedAt().toString()
        ));

        return new AcceptInvitationResponse(
                saved.getUserId(),
                saved.getOrgRole(),
                saved.getJoinedAt(),
                org.getId(),
                org.getSlug(),
                org.getName()
        );
    }

    // ── List / revoke ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<InvitationResponse> getAllOrgInvitations(UUID orgId, OrgRoles callerRole, Status status) {
        if (!callerRole.isAtLeast(OrgRoles.ORG_ADMIN))
            throw new OrgAccessDeniedException("You are not allowed to view invitations");

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
            throw new OrgAccessDeniedException("You are not allowed to revoke invitations");

        OrgInvitation invitation = orgInvitationRepository.findByIdAndOrganization_Id(invitationId, orgId)
                .orElseThrow(() -> new InvitationNotFoundException("Invitation not found"));

        if (!invitation.getStatus().equals(Status.PENDING))
            throw new InvalidInvitationStatusException("Cannot revoke an invitation that is not pending");

        invitation.setStatus(Status.REVOKED);
        orgInvitationRepository.save(invitation);
    }
}