package io.bento.orgservice.mapper;

import io.bento.orgservice.dto.response.InvitationResponse;
import io.bento.orgservice.entity.OrgInvitation;
import io.bento.orgservice.entity.Organization;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.enums.Status;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class OrgInvitationMapperTest {

    private final OrgInvitationMapper mapper = new OrgInvitationMapper();

    private static final UUID INV_ID    = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID ORG_ID    = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID ADMIN_ID  = UUID.fromString("00000000-0000-0000-0000-000000000003");

    @Test
    void toInvitationResponse_mapsAllFields() {
        Instant expiresAt = Instant.now().plusSeconds(86400);
        Instant createdAt = Instant.now();
        Organization org = Organization.builder().id(ORG_ID).name("Acme").slug("acme").ownerId(ADMIN_ID).build();
        OrgInvitation invitation = OrgInvitation.builder()
                .id(INV_ID)
                .organization(org)
                .email("user@example.com")
                .orgRole(OrgRoles.ORG_MEMBER)
                .status(Status.PENDING)
                .invitedBy(ADMIN_ID)
                .expiresAt(expiresAt)
                .token("my-token-123")
                .build();

        InvitationResponse response = mapper.toInvitationResponse(invitation);

        assertThat(response.id()).isEqualTo(INV_ID);
        assertThat(response.email()).isEqualTo("user@example.com");
        assertThat(response.orgRole()).isEqualTo(OrgRoles.ORG_MEMBER);
        assertThat(response.status()).isEqualTo(Status.PENDING);
        assertThat(response.invitedBy()).isEqualTo(ADMIN_ID);
        assertThat(response.expiresAt()).isEqualTo(expiresAt);
        assertThat(response.token()).isEqualTo("my-token-123");
    }

    @Test
    void toInvitationResponse_openLink_emailIsNull() {
        OrgInvitation invitation = OrgInvitation.builder()
                .id(INV_ID)
                .organization(Organization.builder().id(ORG_ID).name("Acme").slug("acme").ownerId(ADMIN_ID).build())
                .email(null)  // open link
                .orgRole(OrgRoles.ORG_MEMBER)
                .status(Status.PENDING)
                .invitedBy(ADMIN_ID)
                .token("open-link-token")
                .build();

        InvitationResponse response = mapper.toInvitationResponse(invitation);

        assertThat(response.email()).isNull();
        assertThat(response.token()).isEqualTo("open-link-token");
    }

    @Test
    void toInvitationResponse_revokedStatus_preserved() {
        OrgInvitation invitation = OrgInvitation.builder()
                .id(INV_ID)
                .organization(Organization.builder().id(ORG_ID).name("Acme").slug("acme").ownerId(ADMIN_ID).build())
                .email("user@example.com")
                .orgRole(OrgRoles.ORG_ADMIN)
                .status(Status.REVOKED)
                .invitedBy(ADMIN_ID)
                .token("tok")
                .build();

        InvitationResponse response = mapper.toInvitationResponse(invitation);

        assertThat(response.status()).isEqualTo(Status.REVOKED);
        assertThat(response.orgRole()).isEqualTo(OrgRoles.ORG_ADMIN);
    }
}
