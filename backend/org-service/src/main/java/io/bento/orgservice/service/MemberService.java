package io.bento.orgservice.service;

import io.bento.orgservice.dto.request.UpdateMemberRoleRequest;
import io.bento.orgservice.dto.response.MemberResponse;
import io.bento.orgservice.entity.OrganizationMember;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.exception.OrgAccessDeniedException;
import io.bento.orgservice.exception.OrganizationMemberNotFoundException;
import io.bento.orgservice.mapper.OrgMemberMapper;
import io.bento.orgservice.repository.OrganizationMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class MemberService {

    private final OrganizationMemberRepository organizationMemberRepository;
    private final OrgMemberMapper orgMemberMapper;

    @Transactional
    public List<MemberResponse> getAllOrgMember(UUID userid, UUID orgId) {
        // check if the Member is part of the org so it can access the private information about Organization member
         if (!organizationMemberRepository.existsByOrganization_IdAndUserId(orgId, userid))
             throw  new OrgAccessDeniedException("You not Member of the Organization. Access denied");
         List<OrganizationMember> organizationMembers = organizationMemberRepository.findAllByOrganization_Id(orgId);
         return organizationMembers.stream().map(orgMemberMapper::toMemberResponse).toList();
    }

    @Transactional
    public MemberResponse updateMemberRole(UUID adminUserId, UUID userId, UUID orgId, UpdateMemberRoleRequest roleRequest) {
        // admin check
        OrganizationMember organizationAdmin =
                organizationMemberRepository.findAllByOrganization_IdAndUserId(orgId,adminUserId)
                        .orElseThrow(() -> new OrgAccessDeniedException("You not Member of the Organization. Access denied"));
        if (!organizationAdmin.getOrgRole().isAtLeast(OrgRoles.ORG_ADMIN))
            throw new OrgAccessDeniedException("You are not allowed to change the Organization Role.  Access denied");
        // strict you can update role that less than yours
        if (roleRequest.orgRole().isLeast(organizationAdmin.getOrgRole()))
            throw new OrgAccessDeniedException("You are not allowed to change to that role the Organization Role.  " +
                    "Access denied");
        // member to update part of the Org
        OrganizationMember memberToUpdate =
                organizationMemberRepository.findAllByOrganization_IdAndUserId(orgId, userId)

                        .orElseThrow(() ->  new OrganizationMemberNotFoundException("cant update an user that not " +
                                "part of Organization"));
        // owner role can only be changed via transfer ownership endpoint
        if (memberToUpdate.getOrgRole() == OrgRoles.ORG_OWNER)
            throw new OrgAccessDeniedException("Cannot change the owner's role. Use the transfer ownership endpoint.");
        // update the role + save
        memberToUpdate.setOrgRole(roleRequest.orgRole());
        OrganizationMember updatedMember = organizationMemberRepository.save(memberToUpdate);
        return orgMemberMapper.toMemberResponse(updatedMember);

    }
}
