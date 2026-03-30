package io.bento.orgservice.repository;

import io.bento.orgservice.entity.Organization;
import io.bento.orgservice.entity.OrganizationMember;
import io.bento.orgservice.enums.OrgRoles;
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
class OrganizationRepositoryTest {

    @Autowired private OrganizationRepository organizationRepository;
    @Autowired private OrganizationMemberRepository memberRepository;

    // =========================================================================
    // Basic CRUD
    // =========================================================================

    @Test
    void save_persistsOrgWithGeneratedId() {
        Organization saved = organizationRepository.save(buildOrg("acme", UUID.randomUUID()));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getName()).isEqualTo("Acme Corp");
        assertThat(saved.getSlug()).isEqualTo("acme");
    }

    @Test
    void findById_whenExists_returnsOrg() {
        Organization saved = organizationRepository.save(buildOrg("acme", UUID.randomUUID()));

        Optional<Organization> result = organizationRepository.findById(saved.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getSlug()).isEqualTo("acme");
    }

    @Test
    void findById_whenNotExists_returnsEmpty() {
        Optional<Organization> result = organizationRepository.findById(UUID.randomUUID());

        assertThat(result).isEmpty();
    }

    @Test
    void delete_removesOrg() {
        Organization saved = organizationRepository.save(buildOrg("acme", UUID.randomUUID()));

        organizationRepository.delete(saved);

        assertThat(organizationRepository.findById(saved.getId())).isEmpty();
    }

    // =========================================================================
    // existsBySlug
    // =========================================================================

    @Test
    void existsBySlug_whenExists_returnsTrue() {
        organizationRepository.save(buildOrg("acme", UUID.randomUUID()));

        assertThat(organizationRepository.existsBySlug("acme")).isTrue();
    }

    @Test
    void existsBySlug_whenNotExists_returnsFalse() {
        assertThat(organizationRepository.existsBySlug("nonexistent")).isFalse();
    }

    // =========================================================================
    // findBySlug
    // =========================================================================

    @Test
    void findBySlug_whenExists_returnsOrg() {
        organizationRepository.save(buildOrg("acme", UUID.randomUUID()));

        Optional<Organization> result = organizationRepository.findBySlug("acme");

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Acme Corp");
    }

    @Test
    void findBySlug_whenNotExists_returnsEmpty() {
        Optional<Organization> result = organizationRepository.findBySlug("ghost");

        assertThat(result).isEmpty();
    }

    // =========================================================================
    // findAllByMemberUserId
    // =========================================================================

    @Test
    void findAllByMemberUserId_returnsOrgsForMember() {
        UUID userId = UUID.randomUUID();
        Organization org = organizationRepository.save(buildOrg("acme", userId));
        memberRepository.save(OrganizationMember.builder()
                .organization(org).userId(userId).orgRole(OrgRoles.ORG_OWNER).build());

        List<Organization> orgs = organizationRepository.findAllByMemberUserId(userId);

        assertThat(orgs).hasSize(1);
        assertThat(orgs.get(0).getSlug()).isEqualTo("acme");
    }

    @Test
    void findAllByMemberUserId_noMemberships_returnsEmpty() {
        List<Organization> orgs = organizationRepository.findAllByMemberUserId(UUID.randomUUID());

        assertThat(orgs).isEmpty();
    }

    @Test
    void findAllByMemberUserId_memberInMultipleOrgs_returnsAll() {
        UUID userId = UUID.randomUUID();
        Organization org1 = organizationRepository.save(buildOrg("org1", userId));
        Organization org2 = organizationRepository.save(buildOrg("org2", userId));
        memberRepository.save(OrganizationMember.builder()
                .organization(org1).userId(userId).orgRole(OrgRoles.ORG_OWNER).build());
        memberRepository.save(OrganizationMember.builder()
                .organization(org2).userId(userId).orgRole(OrgRoles.ORG_MEMBER).build());

        List<Organization> orgs = organizationRepository.findAllByMemberUserId(userId);

        assertThat(orgs).hasSize(2);
    }

    // =========================================================================
    // Constraints
    // =========================================================================

    @Test
    void save_duplicateSlug_throwsConstraintViolation() {
        UUID ownerId = UUID.randomUUID();
        organizationRepository.save(buildOrg("acme", ownerId));

        assertThatThrownBy(() -> {
            organizationRepository.saveAndFlush(buildOrg("acme", ownerId));
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private Organization buildOrg(String slug, UUID ownerId) {
        return Organization.builder()
                .name("Acme Corp")
                .slug(slug)
                .ownerId(ownerId)
                .build();
    }
}
