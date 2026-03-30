package io.bento.orgservice.mapper;

import io.bento.orgservice.dto.request.CreateOrgRequest;
import io.bento.orgservice.dto.response.OrgResponse;
import io.bento.orgservice.entity.Organization;
import io.bento.orgservice.enums.OrgPlan;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class OrgMapperTest {

    private final OrgMapper orgMapper = new OrgMapper();

    private static final UUID ORG_ID   = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID OWNER_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    // =========================================================================
    // toResponse
    // =========================================================================

    @Test
    void toResponse_mapsAllFieldsCorrectly() {
        Instant now = Instant.now();
        Organization org = Organization.builder()
                .id(ORG_ID)
                .name("Acme Corp")
                .slug("acme")
                .domain("acme.io")
                .logoUrl("https://logo.png")
                .description("Best company")
                .plan(OrgPlan.STANDARD)
                .settings(Map.of("maxUsers", 100))
                .ownerId(OWNER_ID)
                .isActive(true)
                .isDefault(true)
                .setupCompleted(true)
                .createdAt(now)
                .updatedAt(now)
                .build();

        OrgResponse response = orgMapper.toResponse(org);

        assertThat(response.id()).isEqualTo(ORG_ID);
        assertThat(response.name()).isEqualTo("Acme Corp");
        assertThat(response.slug()).isEqualTo("acme");
        assertThat(response.domain()).isEqualTo("acme.io");
        assertThat(response.logoUrl()).isEqualTo("https://logo.png");
        assertThat(response.description()).isEqualTo("Best company");
        assertThat(response.plan()).isEqualTo(OrgPlan.STANDARD);
        assertThat(response.settings()).containsEntry("maxUsers", 100);
        assertThat(response.ownerId()).isEqualTo(OWNER_ID);
        assertThat(response.isActive()).isTrue();
        assertThat(response.isDefault()).isTrue();
        assertThat(response.setupCompleted()).isTrue();
        assertThat(response.createdAt()).isEqualTo(now);
        assertThat(response.updatedAt()).isEqualTo(now);
    }

    @Test
    void toResponse_nullOptionalFields_areNull() {
        Organization org = Organization.builder()
                .id(ORG_ID).name("Acme").slug("acme").ownerId(OWNER_ID).build();

        OrgResponse response = orgMapper.toResponse(org);

        assertThat(response.domain()).isNull();
        assertThat(response.logoUrl()).isNull();
        assertThat(response.description()).isNull();
    }

    // =========================================================================
    // toEntity
    // =========================================================================

    @Test
    void toEntity_mapsAllRequestFieldsAndOwnerId() {
        CreateOrgRequest request = new CreateOrgRequest(
                "Acme Corp", "acme", "acme.io", "https://logo.png", "Best company");

        Organization entity = orgMapper.toEntity(request, OWNER_ID);

        assertThat(entity.getName()).isEqualTo("Acme Corp");
        assertThat(entity.getSlug()).isEqualTo("acme");
        assertThat(entity.getDomain()).isEqualTo("acme.io");
        assertThat(entity.getLogoUrl()).isEqualTo("https://logo.png");
        assertThat(entity.getDescription()).isEqualTo("Best company");
        assertThat(entity.getOwnerId()).isEqualTo(OWNER_ID);
    }

    @Test
    void toEntity_nullOptionalFields_remainNull() {
        CreateOrgRequest request = new CreateOrgRequest("Acme Corp", "acme", null, null, null);

        Organization entity = orgMapper.toEntity(request, OWNER_ID);

        assertThat(entity.getDomain()).isNull();
        assertThat(entity.getLogoUrl()).isNull();
        assertThat(entity.getDescription()).isNull();
    }

    @Test
    void toEntity_ownerIdSetCorrectly() {
        CreateOrgRequest request = new CreateOrgRequest("Test", "test", null, null, null);
        UUID specificOwner = UUID.randomUUID();

        Organization entity = orgMapper.toEntity(request, specificOwner);

        assertThat(entity.getOwnerId()).isEqualTo(specificOwner);
    }
}
