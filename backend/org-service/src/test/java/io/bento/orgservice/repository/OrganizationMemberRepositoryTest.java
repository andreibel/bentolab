package io.bento.orgservice.repository;

import io.bento.orgservice.entity.Organization;
import io.bento.orgservice.entity.OrganizationMember;
import io.bento.orgservice.enums.OrgRoles;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.annotation.DirtiesContext;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class OrganizationMemberRepositoryTest {

    @Autowired private OrganizationMemberRepository memberRepository;
    @Autowired private OrganizationRepository organizationRepository;

    private Organization org;
    private static final UUID OWNER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @BeforeEach
    void setUp() {
        org = organizationRepository.save(Organization.builder()
                .name("Test Org").slug("test-org").ownerId(OWNER_ID).build());
    }

    // =========================================================================
    // Basic CRUD
    // =========================================================================

    @Test
    void save_persistsMemberWithGeneratedId() {
        OrganizationMember saved = memberRepository.save(buildMember(OWNER_ID, OrgRoles.ORG_OWNER));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getUserId()).isEqualTo(OWNER_ID);
        assertThat(saved.getOrgRole()).isEqualTo(OrgRoles.ORG_OWNER);
    }

    // =========================================================================
    // findAllByOrganization_IdAndUserId
    // =========================================================================

    @Test
    void findAllByOrganization_IdAndUserId_whenExists_returnsPresent() {
        memberRepository.save(buildMember(OWNER_ID, OrgRoles.ORG_OWNER));

        Optional<OrganizationMember> result =
                memberRepository.findAllByOrganization_IdAndUserId(org.getId(), OWNER_ID);

        assertThat(result).isPresent();
        assertThat(result.get().getOrgRole()).isEqualTo(OrgRoles.ORG_OWNER);
    }

    @Test
    void findAllByOrganization_IdAndUserId_whenNotExists_returnsEmpty() {
        Optional<OrganizationMember> result =
                memberRepository.findAllByOrganization_IdAndUserId(org.getId(), UUID.randomUUID());

        assertThat(result).isEmpty();
    }

    // =========================================================================
    // existsByOrganization_IdAndUserId
    // =========================================================================

    @Test
    void existsByOrganization_IdAndUserId_whenExists_returnsTrue() {
        memberRepository.save(buildMember(OWNER_ID, OrgRoles.ORG_OWNER));

        assertThat(memberRepository.existsByOrganization_IdAndUserId(org.getId(), OWNER_ID)).isTrue();
    }

    @Test
    void existsByOrganization_IdAndUserId_whenNotExists_returnsFalse() {
        assertThat(memberRepository.existsByOrganization_IdAndUserId(org.getId(), UUID.randomUUID())).isFalse();
    }

    // =========================================================================
    // findAllByOrganization_Id
    // =========================================================================

    @Test
    void findAllByOrganization_Id_returnsAllMembersForOrg() {
        UUID userId2 = UUID.randomUUID();
        memberRepository.save(buildMember(OWNER_ID, OrgRoles.ORG_OWNER));
        memberRepository.save(buildMember(userId2, OrgRoles.ORG_MEMBER));

        List<OrganizationMember> members = memberRepository.findAllByOrganization_Id(org.getId());

        assertThat(members).hasSize(2);
    }

    @Test
    void findAllByOrganization_Id_differentOrg_returnsEmpty() {
        memberRepository.save(buildMember(OWNER_ID, OrgRoles.ORG_OWNER));

        List<OrganizationMember> members = memberRepository.findAllByOrganization_Id(UUID.randomUUID());

        assertThat(members).isEmpty();
    }

    // =========================================================================
    // findRoleByOrgIdAndUserId
    // =========================================================================

    @Test
    void findRoleByOrgIdAndUserId_whenExists_returnsRole() {
        memberRepository.save(buildMember(OWNER_ID, OrgRoles.ORG_ADMIN));

        Optional<OrgRoles> role = memberRepository.findRoleByOrgIdAndUserId(org.getId(), OWNER_ID);

        assertThat(role).isPresent().hasValue(OrgRoles.ORG_ADMIN);
    }

    @Test
    void findRoleByOrgIdAndUserId_whenNotExists_returnsEmpty() {
        Optional<OrgRoles> role = memberRepository.findRoleByOrgIdAndUserId(org.getId(), UUID.randomUUID());

        assertThat(role).isEmpty();
    }

    // =========================================================================
    // findAllByUserIdWithOrg
    // =========================================================================

    @Test
    void findAllByUserIdWithOrg_returnsMembershipsWithOrg() {
        memberRepository.save(buildMember(OWNER_ID, OrgRoles.ORG_OWNER));

        List<OrganizationMember> results = memberRepository.findAllByUserIdWithOrg(OWNER_ID);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getOrganization()).isNotNull();
        assertThat(results.get(0).getOrganization().getSlug()).isEqualTo("test-org");
    }

    @Test
    void findAllByUserIdWithOrg_noMemberships_returnsEmpty() {
        List<OrganizationMember> results = memberRepository.findAllByUserIdWithOrg(UUID.randomUUID());

        assertThat(results).isEmpty();
    }

    // =========================================================================
    // Constraints
    // =========================================================================

    @Test
    void save_duplicateOrgAndUser_throwsConstraintViolation() {
        memberRepository.save(buildMember(OWNER_ID, OrgRoles.ORG_OWNER));

        assertThatThrownBy(() ->
                memberRepository.saveAndFlush(buildMember(OWNER_ID, OrgRoles.ORG_MEMBER)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private OrganizationMember buildMember(UUID userId, OrgRoles role) {
        return OrganizationMember.builder()
                .organization(org)
                .userId(userId)
                .orgRole(role)
                .build();
    }
}
