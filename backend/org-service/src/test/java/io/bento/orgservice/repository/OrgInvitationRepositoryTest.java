package io.bento.orgservice.repository;

import io.bento.orgservice.entity.OrgInvitation;
import io.bento.orgservice.entity.Organization;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.enums.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.annotation.DirtiesContext;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class OrgInvitationRepositoryTest {

    @Autowired private OrgInvitationRepository invitationRepository;
    @Autowired private OrganizationRepository organizationRepository;

    private Organization org;
    private static final UUID INVITER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @BeforeEach
    void setUp() {
        org = organizationRepository.save(Organization.builder()
                .name("Acme").slug("acme").ownerId(INVITER_ID).build());
    }

    // =========================================================================
    // Basic save
    // =========================================================================

    @Test
    void save_persistsInvitationWithGeneratedIdAndDefaultExpiry() {
        OrgInvitation saved = invitationRepository.save(buildInvitation("user@example.com", "tok-1"));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getStatus()).isEqualTo(Status.PENDING);
        assertThat(saved.getExpiresAt()).isAfter(Instant.now());
        assertThat(saved.getCreatedAt()).isNotNull();
    }

    // =========================================================================
    // existsByOrganization_IdAndEmailAndStatus
    // =========================================================================

    @Test
    void existsByOrg_Email_Status_pendingExists_returnsTrue() {
        invitationRepository.save(buildInvitation("user@example.com", "tok-1"));

        assertThat(invitationRepository.existsByOrganization_IdAndEmailAndStatus(
                org.getId(), "user@example.com", Status.PENDING)).isTrue();
    }

    @Test
    void existsByOrg_Email_Status_acceptedStatus_returnsFalse() {
        OrgInvitation inv = invitationRepository.save(buildInvitation("user@example.com", "tok-1"));
        inv.setStatus(Status.ACCEPTED);
        invitationRepository.save(inv);

        assertThat(invitationRepository.existsByOrganization_IdAndEmailAndStatus(
                org.getId(), "user@example.com", Status.PENDING)).isFalse();
    }

    @Test
    void existsByOrg_Email_Status_differentEmail_returnsFalse() {
        invitationRepository.save(buildInvitation("user@example.com", "tok-1"));

        assertThat(invitationRepository.existsByOrganization_IdAndEmailAndStatus(
                org.getId(), "other@example.com", Status.PENDING)).isFalse();
    }

    // =========================================================================
    // findAllByOrganization_Id
    // =========================================================================

    @Test
    void findAllByOrganization_Id_returnsAll() {
        invitationRepository.save(buildInvitation("a@example.com", "tok-a"));
        invitationRepository.save(buildInvitation("b@example.com", "tok-b"));

        List<OrgInvitation> result = invitationRepository.findAllByOrganization_Id(org.getId());

        assertThat(result).hasSize(2);
    }

    @Test
    void findAllByOrganization_Id_wrongOrg_returnsEmpty() {
        invitationRepository.save(buildInvitation("a@example.com", "tok-a"));

        List<OrgInvitation> result = invitationRepository.findAllByOrganization_Id(UUID.randomUUID());

        assertThat(result).isEmpty();
    }

    // =========================================================================
    // findAllByOrganization_IdAndStatus
    // =========================================================================

    @Test
    void findAllByOrganization_IdAndStatus_filtersByStatus() {
        invitationRepository.save(buildInvitation("a@example.com", "tok-a"));
        OrgInvitation accepted = invitationRepository.save(buildInvitation("b@example.com", "tok-b"));
        accepted.setStatus(Status.ACCEPTED);
        invitationRepository.save(accepted);

        List<OrgInvitation> result = invitationRepository.findAllByOrganization_IdAndStatus(org.getId(), Status.PENDING);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getEmail()).isEqualTo("a@example.com");
    }

    // =========================================================================
    // findByIdAndOrganization_Id
    // =========================================================================

    @Test
    void findByIdAndOrganization_Id_whenExists_returnsPresent() {
        OrgInvitation saved = invitationRepository.save(buildInvitation("a@example.com", "tok-1"));

        Optional<OrgInvitation> result =
                invitationRepository.findByIdAndOrganization_Id(saved.getId(), org.getId());

        assertThat(result).isPresent();
    }

    @Test
    void findByIdAndOrganization_Id_wrongOrg_returnsEmpty() {
        OrgInvitation saved = invitationRepository.save(buildInvitation("a@example.com", "tok-1"));

        Optional<OrgInvitation> result =
                invitationRepository.findByIdAndOrganization_Id(saved.getId(), UUID.randomUUID());

        assertThat(result).isEmpty();
    }

    // =========================================================================
    // findByToken
    // =========================================================================

    @Test
    void findByToken_whenExists_returnsPresent() {
        invitationRepository.save(buildInvitation("a@example.com", "unique-token-123"));

        Optional<OrgInvitation> result = invitationRepository.findByToken("unique-token-123");

        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo("a@example.com");
    }

    @Test
    void findByToken_whenNotExists_returnsEmpty() {
        Optional<OrgInvitation> result = invitationRepository.findByToken("ghost-token");

        assertThat(result).isEmpty();
    }

    // =========================================================================
    // findByEmailAndToken
    // =========================================================================

    @Test
    void findByEmailAndToken_whenMatch_returnsPresent() {
        invitationRepository.save(buildInvitation("a@example.com", "tok-match"));

        Optional<OrgInvitation> result =
                invitationRepository.findByEmailAndToken("a@example.com", "tok-match");

        assertThat(result).isPresent();
    }

    @Test
    void findByEmailAndToken_wrongEmail_returnsEmpty() {
        invitationRepository.save(buildInvitation("a@example.com", "tok-match"));

        Optional<OrgInvitation> result =
                invitationRepository.findByEmailAndToken("other@example.com", "tok-match");

        assertThat(result).isEmpty();
    }

    // =========================================================================
    // Constraints
    // =========================================================================

    @Test
    void save_duplicateToken_throwsConstraintViolation() {
        invitationRepository.save(buildInvitation("a@example.com", "same-token"));

        assertThatThrownBy(() ->
                invitationRepository.saveAndFlush(buildInvitation("b@example.com", "same-token")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private OrgInvitation buildInvitation(String email, String token) {
        return OrgInvitation.builder()
                .organization(org)
                .email(email)
                .orgRole(OrgRoles.ORG_MEMBER)
                .token(token)
                .invitedBy(INVITER_ID)
                .build();
    }
}
