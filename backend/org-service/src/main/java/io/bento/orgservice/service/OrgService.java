package io.bento.orgservice.service;

import io.bento.orgservice.dto.request.CreateOrgRequest;
import io.bento.orgservice.dto.response.OrgResponse;
import io.bento.orgservice.entity.Organization;
import io.bento.orgservice.entity.OrganizationMember;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.exception.SlugAlreadyExistsException;
import io.bento.orgservice.mapper.OrgMapper;
import io.bento.orgservice.repository.OrganizationMemberRepository;
import io.bento.orgservice.repository.OrganizationRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
            throw new SlugAlreadyExistsException(request.slug());
        }

        Organization organization = orgMapper.toEntity(request, userid);
        OrganizationMember ownerMember = OrganizationMember.builder()
                .organization(organization)
                .userId(userid)
                .orgRole(OrgRoles.ORG_OWNER)
                .build();
        Organization savedOrg = organizationRepository.save(organization);
        organizationMemberRepository.save(ownerMember);
        return orgMapper.toResponse(savedOrg);
    }
}
