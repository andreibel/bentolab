package io.bento.orgservice.mapper;

import io.bento.orgservice.dto.request.CreateOrgRequest;
import io.bento.orgservice.dto.response.OrgResponse;
import io.bento.orgservice.entity.Organization;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class OrgMapper {
    public OrgResponse toResponse(Organization organization) {
        return new OrgResponse(
                organization.getId(),
                organization.getName(),
                organization.getSlug(),
                organization.getDomain(),
                organization.getLogoUrl(),
                organization.getDescription(),
                organization.getPlan(),
                organization.getSettings(),
                organization.getOwnerId(),
                organization.isActive(),
                organization.isDefault(),
                organization.isSetupCompleted(),
                organization.getCreatedAt(),
                organization.getUpdatedAt()
        );
    }

    public Organization toEntity(CreateOrgRequest orgRequest, UUID ownerId) {
        return Organization.builder()
                .name(orgRequest.name())
                .slug(orgRequest.slug())
                .domain(orgRequest.domain())
                .logoUrl(orgRequest.logoUrl())
                .description(orgRequest.description())
                .ownerId(ownerId)
                .build();
    }
}
