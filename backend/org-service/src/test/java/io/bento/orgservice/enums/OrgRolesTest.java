package io.bento.orgservice.enums;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OrgRolesTest {

    // =========================================================================
    // isAtLeast
    // =========================================================================

    @Test
    void isAtLeast_memberOnMember_true() {
        assertThat(OrgRoles.ORG_MEMBER.isAtLeast(OrgRoles.ORG_MEMBER)).isTrue();
    }

    @Test
    void isAtLeast_memberOnAdmin_false() {
        assertThat(OrgRoles.ORG_MEMBER.isAtLeast(OrgRoles.ORG_ADMIN)).isFalse();
    }

    @Test
    void isAtLeast_memberOnOwner_false() {
        assertThat(OrgRoles.ORG_MEMBER.isAtLeast(OrgRoles.ORG_OWNER)).isFalse();
    }

    @Test
    void isAtLeast_adminOnMember_true() {
        assertThat(OrgRoles.ORG_ADMIN.isAtLeast(OrgRoles.ORG_MEMBER)).isTrue();
    }

    @Test
    void isAtLeast_adminOnAdmin_true() {
        assertThat(OrgRoles.ORG_ADMIN.isAtLeast(OrgRoles.ORG_ADMIN)).isTrue();
    }

    @Test
    void isAtLeast_adminOnOwner_false() {
        assertThat(OrgRoles.ORG_ADMIN.isAtLeast(OrgRoles.ORG_OWNER)).isFalse();
    }

    @Test
    void isAtLeast_ownerOnMember_true() {
        assertThat(OrgRoles.ORG_OWNER.isAtLeast(OrgRoles.ORG_MEMBER)).isTrue();
    }

    @Test
    void isAtLeast_ownerOnAdmin_true() {
        assertThat(OrgRoles.ORG_OWNER.isAtLeast(OrgRoles.ORG_ADMIN)).isTrue();
    }

    @Test
    void isAtLeast_ownerOnOwner_true() {
        assertThat(OrgRoles.ORG_OWNER.isAtLeast(OrgRoles.ORG_OWNER)).isTrue();
    }

    // =========================================================================
    // isHigherThan
    // =========================================================================

    @Test
    void isHigherThan_memberOnMember_false() {
        assertThat(OrgRoles.ORG_MEMBER.isHigherThan(OrgRoles.ORG_MEMBER)).isFalse();
    }

    @Test
    void isHigherThan_memberOnAdmin_false() {
        assertThat(OrgRoles.ORG_MEMBER.isHigherThan(OrgRoles.ORG_ADMIN)).isFalse();
    }

    @Test
    void isHigherThan_adminOnMember_true() {
        assertThat(OrgRoles.ORG_ADMIN.isHigherThan(OrgRoles.ORG_MEMBER)).isTrue();
    }

    @Test
    void isHigherThan_adminOnAdmin_false() {
        assertThat(OrgRoles.ORG_ADMIN.isHigherThan(OrgRoles.ORG_ADMIN)).isFalse();
    }

    @Test
    void isHigherThan_adminOnOwner_false() {
        assertThat(OrgRoles.ORG_ADMIN.isHigherThan(OrgRoles.ORG_OWNER)).isFalse();
    }

    @Test
    void isHigherThan_ownerOnAdmin_true() {
        assertThat(OrgRoles.ORG_OWNER.isHigherThan(OrgRoles.ORG_ADMIN)).isTrue();
    }

    @Test
    void isHigherThan_ownerOnMember_true() {
        assertThat(OrgRoles.ORG_OWNER.isHigherThan(OrgRoles.ORG_MEMBER)).isTrue();
    }

    @Test
    void isHigherThan_ownerOnOwner_false() {
        assertThat(OrgRoles.ORG_OWNER.isHigherThan(OrgRoles.ORG_OWNER)).isFalse();
    }

    // =========================================================================
    // Rank ordering
    // =========================================================================

    @Test
    void ranks_member_isLowest() {
        assertThat(OrgRoles.ORG_MEMBER.isHigherThan(OrgRoles.ORG_ADMIN)).isFalse();
        assertThat(OrgRoles.ORG_MEMBER.isHigherThan(OrgRoles.ORG_OWNER)).isFalse();
    }

    @Test
    void ranks_owner_isHighest() {
        assertThat(OrgRoles.ORG_OWNER.isHigherThan(OrgRoles.ORG_ADMIN)).isTrue();
        assertThat(OrgRoles.ORG_OWNER.isHigherThan(OrgRoles.ORG_MEMBER)).isTrue();
    }
}
