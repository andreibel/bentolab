package io.bento.orgservice.service;

import io.bento.orgservice.dto.request.UpdateMemberRoleRequest;
import io.bento.orgservice.dto.response.MemberResponse;
import io.bento.orgservice.entity.OrganizationMember;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.event.MemberRemovedEvent;
import io.bento.orgservice.event.MemberRoleChangedEvent;
import io.bento.orgservice.event.OrgEventPublisher;
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
    private final OrgEventPublisher orgEventPublisher;

    // Membership guaranteed by gateway (X-Org-Id header present) — no existence check needed
    @Transactional(readOnly = true)
    public List<MemberResponse> getAllOrgMember(UUID orgId) {
        return organizationMemberRepository.findAllByOrganization_Id(orgId)
                .stream().map(orgMemberMapper::toMemberResponse).toList();
    }

    @Transactional
    public MemberResponse updateMemberRole(UUID adminUserId, UUID userId, UUID orgId,
                                           OrgRoles callerRole, UpdateMemberRoleRequest roleRequest) {
        if (!callerRole.isAtLeast(OrgRoles.ORG_ADMIN))
            throw new OrgAccessDeniedException("You are not allowed to change the Organization Role. Access denied");

        if (roleRequest.orgRole().isHigherThan(callerRole))
            throw new OrgAccessDeniedException("You are not allowed to promote to a role higher than yours. Access denied");

        OrganizationMember memberToUpdate = getTargetMember(userId, orgId);

        if (memberToUpdate.getOrgRole() == OrgRoles.ORG_OWNER)
            throw new OrgAccessDeniedException("Cannot change the owner's role. Use the transfer ownership endpoint.");

        memberToUpdate.setOrgRole(roleRequest.orgRole());
        OrganizationMember updatedMember = organizationMemberRepository.save(memberToUpdate);

        orgEventPublisher.publishMemberRoleChanged(
                new MemberRoleChangedEvent(orgId, userId, roleRequest.orgRole()));

        return orgMemberMapper.toMemberResponse(updatedMember);
    }

    @Transactional
    public void deleteMember(UUID adminUserId, UUID userId, UUID orgId, OrgRoles callerRole) {
        OrganizationMember memberToDelete = getTargetMember(userId, orgId);

        boolean isSelfDelete = adminUserId.equals(userId) && callerRole != OrgRoles.ORG_OWNER;
        boolean canDeleteOther = callerRole.isHigherThan(memberToDelete.getOrgRole());

        if (isSelfDelete || canDeleteOther) {
            organizationMemberRepository.delete(memberToDelete);
            orgEventPublisher.publishMemberRemoved(new MemberRemovedEvent(orgId, userId));
        } else {
            throw new OrgAccessDeniedException("You cannot delete this member");
        }
    }

    private OrganizationMember getTargetMember(UUID userId, UUID orgId) {
        return organizationMemberRepository.findAllByOrganization_IdAndUserId(orgId, userId)
                .orElseThrow(() -> new OrganizationMemberNotFoundException("Member not found in the organization"));
    }
}
