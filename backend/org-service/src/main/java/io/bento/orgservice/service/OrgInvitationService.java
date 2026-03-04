package io.bento.orgservice.service;

import io.bento.orgservice.dto.request.SendInvitationRequest;
import io.bento.orgservice.dto.response.InvitationResponse;
import io.bento.orgservice.entity.OrgInvitation;
import io.bento.orgservice.entity.Organization;
import io.bento.orgservice.entity.OrganizationMember;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.enums.Status;
import io.bento.orgservice.exception.InvitationAlreadyExistsException;
import io.bento.orgservice.exception.OrgAccessDeniedException;
import io.bento.orgservice.mapper.OrgInvitationMapper;
import io.bento.orgservice.repository.OrgInvitationRepository;
import io.bento.orgservice.repository.OrganizationMemberRepository;
import io.bento.orgservice.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrgInvitationService {

    private final OrganizationMemberRepository organizationMemberRepository;
    private final OrganizationRepository organizationRepository;
    private final OrgInvitationRepository orgInvitationRepository;
    private final OrgInvitationMapper orgInvitationMapper;

    @Transactional
    public InvitationResponse sentNewInvitation(UUID adminId, UUID orgId, SendInvitationRequest invitationRequest) {
        // check part of the organization
        OrganizationMember orgAdmin = getCallerMember(adminId, orgId);

        // check premonition
        if (!orgAdmin.getOrgRole().isAtLeast(OrgRoles.ORG_ADMIN))
            throw new OrgAccessDeniedException("you are not allowed to invite new members to this organization");
        // chack that you have premonition to invite to this role,
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
        OrganizationMember orgAdmin = getCallerMember(adminId, orgId);
        if (!orgAdmin.getOrgRole().isAtLeast(OrgRoles.ORG_ADMIN))
            throw new OrgAccessDeniedException("you are not allowed to get all initiation for this organization");

        if (status == null) {
            return orgInvitationRepository.findAllByOrganization_Id(orgId)
                    .stream().map(orgInvitationMapper::toInvitationResponse).toList();
        }
        return orgInvitationRepository.findAllByOrganization_IdAndStatus(orgId, status)
                .stream().map(orgInvitationMapper::toInvitationResponse).toList();

    }


    private OrganizationMember getCallerMember(UUID userId, UUID orgId) {
        return organizationMemberRepository.findAllByOrganization_IdAndUserId(orgId, userId)
                .orElseThrow(() -> new OrgAccessDeniedException("You are not a member of the organization. Access denied"));
    }

}
