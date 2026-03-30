package io.bento.orgservice.mapper;

import io.bento.orgservice.dto.response.MemberResponse;
import io.bento.orgservice.entity.OrganizationMember;
import io.bento.orgservice.enums.OrgRoles;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class OrgMemberMapperTest {

    private final OrgMemberMapper mapper = new OrgMemberMapper();

    private static final UUID USER_ID    = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID INVITER_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @Test
    void toMemberResponse_mapsAllFields() {
        Instant joinedAt = Instant.now();
        OrganizationMember member = OrganizationMember.builder()
                .userId(USER_ID)
                .orgRole(OrgRoles.ORG_ADMIN)
                .invitedBy(INVITER_ID)
                .joinedAt(joinedAt)
                .build();

        MemberResponse response = mapper.toMemberResponse(member);

        assertThat(response.userId()).isEqualTo(USER_ID);
        assertThat(response.orgRole()).isEqualTo(OrgRoles.ORG_ADMIN);
        assertThat(response.invitedBy()).isEqualTo(INVITER_ID);
        assertThat(response.joinedAt()).isEqualTo(joinedAt);
    }

    @Test
    void toMemberResponse_nullInvitedBy_isNull() {
        OrganizationMember member = OrganizationMember.builder()
                .userId(USER_ID)
                .orgRole(OrgRoles.ORG_OWNER)
                .invitedBy(null)
                .joinedAt(Instant.now())
                .build();

        MemberResponse response = mapper.toMemberResponse(member);

        assertThat(response.invitedBy()).isNull();
    }

    @Test
    void toMemberResponse_memberRolePreserved() {
        OrganizationMember member = OrganizationMember.builder()
                .userId(USER_ID).orgRole(OrgRoles.ORG_MEMBER).joinedAt(Instant.now()).build();

        MemberResponse response = mapper.toMemberResponse(member);

        assertThat(response.orgRole()).isEqualTo(OrgRoles.ORG_MEMBER);
    }
}
