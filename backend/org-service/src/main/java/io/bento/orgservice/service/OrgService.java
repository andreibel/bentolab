package io.bento.orgservice.service;

import io.bento.orgservice.dto.request.CreateOrgRequest;
import io.bento.orgservice.dto.request.TransferOrgOwnershipRequest;
import io.bento.orgservice.dto.request.UpdateOrgRequest;
import io.bento.orgservice.dto.request.UpdateOrgSettingsRequest;
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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrgService {

    private final OrganizationRepository organizationRepository;
    private final OrgMapper orgMapper;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final OrgPermissionService orgPermissionService;

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
        orgPermissionService.initializeDefaults(savedOrg.getId());
        return orgMapper.toResponse(savedOrg);
    }

    public List<OrgResponse> getMyOrgs(UUID userid) {
        return organizationRepository.findAllByMemberUserId(userid).stream()
                .map(orgMapper::toResponse)
                .toList();
    }

    // Membership guaranteed by gateway (X-Org-Id header present) — no DB membership check needed
    public OrgResponse getOrgById(UUID orgId) {
        Organization organization = organizationRepository.findById(orgId)
                .orElseThrow(() -> new OrgNotFoundException("Organization not found with id: " + orgId));
        return orgMapper.toResponse(organization);
    }

    @Transactional
    public OrgResponse updateOrg(UUID orgId, OrgRoles callerRole, UpdateOrgRequest request) {
        if (!callerRole.isAtLeast(OrgRoles.ORG_ADMIN)) {
            throw new OrgAccessDeniedException("Insufficient permissions");
        }
        Organization organization = organizationRepository.findById(orgId)
                .orElseThrow(() -> new OrgNotFoundException("Organization not found with id: " + orgId));

        if (request.name() != null && !request.name().isBlank()) {
            organization.setName(request.name());
        }
        if (request.domain() != null && !request.domain().isBlank()) {
            organization.setDomain(request.domain());
        }
        if (request.logoUrl() != null && !request.logoUrl().isBlank()) {
            organization.setLogoUrl(request.logoUrl());
        }
        if (request.description() != null) {
            organization.setDescription(request.description());
        }
        return orgMapper.toResponse(organizationRepository.save(organization));
    }

    @Transactional
    public OrgResponse updateOrgSettings(UUID orgId, OrgRoles callerRole, UpdateOrgSettingsRequest request) {
        if (!callerRole.isAtLeast(OrgRoles.ORG_ADMIN)) {
            throw new OrgAccessDeniedException("Insufficient permissions");
        }
        Organization organization = organizationRepository.findById(orgId)
                .orElseThrow(() -> new OrgNotFoundException("Organization not found with id: " + orgId));

        Map<String, Object> settings = organization.getSettings();
        if (request.maxUsers() != null) settings.put("maxUsers", request.maxUsers());
        if (request.maxBoards() != null) settings.put("maxBoards", request.maxBoards());
        if (request.maxStorageGB() != null) settings.put("maxStorageGB", request.maxStorageGB());
        if (request.allowDiscord() != null) settings.put("allowDiscord", request.allowDiscord());
        if (request.allowExport() != null) settings.put("allowExport", request.allowExport());
        if (request.customBranding() != null) settings.put("customBranding", request.customBranding());
        if (request.ssoEnabled() != null) settings.put("ssoEnabled", request.ssoEnabled());

        organization.setSettings(settings);
        return orgMapper.toResponse(organizationRepository.save(organization));
    }

    @Transactional
    public void transferOrgOwnership(UUID userid, UUID orgId, OrgRoles callerRole, TransferOrgOwnershipRequest request) {
        if (request.newOwnerId().equals(userid)) {
            throw new OrgAccessDeniedException("Cannot transfer ownership to yourself");
        }
        if (callerRole != OrgRoles.ORG_OWNER) {
            throw new OrgAccessDeniedException("Only the organization owner can transfer ownership");
        }
        Organization organization = organizationRepository.findById(orgId)
                .orElseThrow(() -> new OrgNotFoundException("Organization not found with id: " + orgId));

        OrganizationMember currentOwnerMember = organizationMemberRepository
                .findAllByOrganization_IdAndUserId(orgId, userid)
                .orElseThrow(() -> new OrgAccessDeniedException("Access denied"));

        OrganizationMember newOwnerMember = organizationMemberRepository
                .findAllByOrganization_IdAndUserId(orgId, request.newOwnerId())
                .orElseThrow(() -> new OrgAccessDeniedException("The new owner must be a member of the organization"));

        currentOwnerMember.setOrgRole(OrgRoles.ORG_ADMIN);
        newOwnerMember.setOrgRole(OrgRoles.ORG_OWNER);
        organization.setOwnerId(request.newOwnerId());
        organizationRepository.save(organization);
        organizationMemberRepository.save(currentOwnerMember);
        organizationMemberRepository.save(newOwnerMember);
    }

    @Transactional
    public void deleteOrg(UUID orgId, OrgRoles callerRole) {
        if (callerRole != OrgRoles.ORG_OWNER) {
            throw new OrgAccessDeniedException("Only the organization owner can delete the organization");
        }
        Organization organization = organizationRepository.findById(orgId)
                .orElseThrow(() -> new OrgNotFoundException("Organization not found with id: " + orgId));
        organizationRepository.delete(organization);
    }
}
