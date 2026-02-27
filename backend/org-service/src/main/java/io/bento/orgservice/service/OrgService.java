package io.bento.orgservice.service;

import io.bento.orgservice.dto.request.CreateOrgRequest;
import io.bento.orgservice.dto.response.OrgResponse;
import io.bento.orgservice.entity.Organization;
import io.bento.orgservice.entity.OrganizationMember;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.exception.OrgAccessDeniedException;
import io.bento.orgservice.exception.OrgNotFoundException;
import io.bento.orgservice.exception.SlugAlreadyExistsException;
import io.bento.orgservice.mapper.OrgMapper;
import io.bento.orgservice.repository.OrganizationMemberRepository;
import io.bento.orgservice.repository.OrganizationRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrgService {


    private final OrganizationRepository organizationRepository;
    private final OrgMapper orgMapper;
    private final OrganizationMemberRepository organizationMemberRepository;

    @Transactional
    public OrgResponse createOrg(UUID userid, CreateOrgRequest request) {
        if (organizationRepository.existsBySlug(request.slug())) {
            throw new SlugAlreadyExistsException("Organization slug already exists: " + request.slug());
        }

        Organization organization = orgMapper.toEntity(request, userid);
        Organization savedOrg = organizationRepository.save(organization);
        OrganizationMember ownerMember = OrganizationMember.builder()
                .organization(savedOrg)
                .userId(userid)
                .orgRole(OrgRoles.ORG_OWNER)
                .build();
        organizationMemberRepository.save(ownerMember);
        return orgMapper.toResponse(savedOrg);
    }


    public List<OrgResponse> getMyOrgs(UUID userid) {
       return organizationRepository.findAllByMemberUserId(userid).stream()
               .map(orgMapper::toResponse)
               .toList();
    }

    public OrgResponse getOrgById(UUID userid, UUID orgId) {
        Organization organization = organizationRepository.findById(orgId)
                .orElseThrow(() -> new OrgNotFoundException("Organization not found with id: " + orgId));
        boolean isMember = organizationMemberRepository.existsByOrganization_IdAndUserId(orgId, userid);
        if (!isMember) {
            throw new OrgAccessDeniedException("Access denied. not a member of the organization");
        }
        return orgMapper.toResponse(organization);
    }
}
