package io.bento.orgservice.service;

import io.bento.orgservice.dto.request.SendInvitationRequest;
import io.bento.orgservice.dto.response.InvitationResponse;
import io.bento.orgservice.dto.response.MemberResponse;
import io.bento.orgservice.entity.OrgInvitation;
import io.bento.orgservice.entity.Organization;
import io.bento.orgservice.entity.OrganizationMember;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.enums.Status;
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

    @Transactional
    public InvitationResponse sentNewInvitation(UUID adminId, UUID orgId, SendInvitationRequest invitationRequest) {
        OrganizationMember orgAdmin = getCallerAdminMember(adminId, orgId);

        // chack that you have premonition to invite to this role
        if (invitationRequest.orgRole().isHigherThan(orgAdmin.getOrgRole()))
            throw new OrgAccessDeniedException("you are not allowed to invite to role higher then yours");
        // there is admin so no need to check if org is existed
        Organization organization = organizationRepository.getReferenceById(orgId);

        // check if it has organization invitation already for this email.
        if (orgInvitationRepository.existsByOrganization_IdAndEmailAndStatus(orgId, invitationRequest.email(), Status.PENDING))
            throw new InvitationAlreadyExistsException("invitation is already been sent");

        // new invitation
        OrgInvitation invitation = OrgInvitation.builder()
                .organization(organization)
                .email(invitationRequest.email())
                .orgRole(invitationRequest.orgRole())
                .token(UUID.randomUUID().toString())
                .invitedBy(adminId)
                .message(invitationRequest.message())
                .build();
        // save them
        OrgInvitation savedInvitation = orgInvitationRepository.save(invitation);

        // TODO: sent message to kafka topic to ent email. org Service ==> kafka ==> notification service
        return orgInvitationMapper.toInvitationResponse(savedInvitation);
    }


    @Transactional(readOnly = true)
    public List<InvitationResponse> getAllOrgActiveInitiation(UUID adminId, UUID orgId, Status status) {
        checkAdminRole(adminId, orgId);
        if (status == null) {
            return orgInvitationRepository.findAllByOrganization_Id(orgId)
                    .stream().map(orgInvitationMapper::toInvitationResponse).toList();
        }
        return orgInvitationRepository.findAllByOrganization_IdAndStatus(orgId, status)
                .stream().map(orgInvitationMapper::toInvitationResponse).toList();

    }


    private OrganizationMember getCallerAdminMember(UUID userId, UUID orgId) {
        OrganizationMember orgAdmin = organizationMemberRepository.findAllByOrganization_IdAndUserId(orgId, userId)
                .orElseThrow(() -> new OrgAccessDeniedException("You are not a member of the organization. Access denied"));
        if (!orgAdmin.getOrgRole().isAtLeast(OrgRoles.ORG_ADMIN))
            throw new OrgAccessDeniedException("you are not allowed to get all initiation for this organization");
        return orgAdmin;
    }

    private void checkAdminRole(UUID userId, UUID orgId) {
        OrgRoles role = organizationMemberRepository.findRoleByOrgIdAndUserId(orgId, userId)
                .orElseThrow(() -> new OrgAccessDeniedException("You are not a member of the organization. Access denied"));
        if (!role.isAtLeast(OrgRoles.ORG_ADMIN))
            throw new OrgAccessDeniedException("you are not allowed to get all initiation for this organization");
    }


    @Transactional
    public void deleteInvitation(UUID adminId, UUID orgId, UUID invitationId) {
        checkAdminRole(adminId, orgId);
        OrgInvitation orgInvitation = orgInvitationRepository.findByIdAndOrganization_Id(invitationId,orgId)
                .orElseThrow(() -> new InvitationNotFoundException("invitation not found"));
        if (!orgInvitation.getStatus().equals(Status.PENDING))
            throw new InvalidInvitationStatusException("Cannot revoke an invitation that is not pending");
        orgInvitation.setStatus(Status.REVOKED);
        orgInvitationRepository.save(orgInvitation);
    }

    @Transactional
    public MemberResponse acceptNewMember(UUID userId, String userEmail, String tokenInvitation) {
        OrgInvitation orgInvitation = orgInvitationRepository.findByEmailAndToken(userEmail, tokenInvitation)
                .orElseThrow(() -> new InvitationNotFoundException("invitation not found"));

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
        return orgMemberMapper.toMemberResponse(savedMember);


    }
}
