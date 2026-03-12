package io.bento.authservice.repository;

import io.bento.authservice.entity.RefreshToken;
import io.bento.authservice.entity.User;
import io.bento.authservice.enums.SystemRole;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.TestPropertySource;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@TestPropertySource(properties = "spring.liquibase.enabled=false")
class RefreshTokenRepositoryTest {

    @Autowired private RefreshTokenRepository repository;
    @Autowired private UserRepository userRepository;
    @Autowired private EntityManager em;

    private User savedUser;

    @BeforeEach
    void setUp() {
        savedUser = userRepository.save(User.builder()
                .email("user@example.com")
                .password("hashed-placeholder")
                .firstName("John")
                .lastName("Doe")
                .systemRole(SystemRole.USER)
                .active(true)
                .emailVerified(false)
                .build());
    }

    // =========================================================================
    // findByToken
    // =========================================================================

    @Test
    void findByToken_existingToken_returnsToken() {
        RefreshToken saved = repository.save(activeToken("tok-abc"));

        assertThat(repository.findByToken("tok-abc"))
                .isPresent()
                .get()
                .extracting(RefreshToken::getId)
                .isEqualTo(saved.getId());
    }

    @Test
    void findByToken_unknownToken_returnsEmpty() {
        assertThat(repository.findByToken("does-not-exist")).isEmpty();
    }

    // =========================================================================
    // findLatestActiveByUserId
    // =========================================================================

    @Test
    void findLatestActive_activeToken_returnsIt() {
        repository.save(activeToken("tok-active"));

        assertThat(repository.findLatestActiveByUserId(savedUser.getId(), Instant.now()))
                .isPresent();
    }

    @Test
    void findLatestActive_revokedToken_returnsEmpty() {
        repository.save(revokedToken("tok-revoked"));

        assertThat(repository.findLatestActiveByUserId(savedUser.getId(), Instant.now()))
                .isEmpty();
    }

    @Test
    void findLatestActive_expiredToken_returnsEmpty() {
        repository.save(RefreshToken.builder()
                .token("tok-expired")
                .user(savedUser)
                .expiresAt(Instant.now().minusSeconds(1))
                .revoked(false)
                .build());

        assertThat(repository.findLatestActiveByUserId(savedUser.getId(), Instant.now()))
                .isEmpty();
    }

    @Test
    void findLatestActive_multipleActive_returnsNewest() {
        // Explicit createdAt to guarantee ordering
        repository.save(RefreshToken.builder()
                .token("tok-old")
                .user(savedUser)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .createdAt(Instant.now().minusSeconds(60))
                .revoked(false)
                .build());
        repository.save(RefreshToken.builder()
                .token("tok-new")
                .user(savedUser)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .createdAt(Instant.now())
                .revoked(false)
                .build());

        Optional<RefreshToken> found = repository.findLatestActiveByUserId(savedUser.getId(), Instant.now());

        assertThat(found).isPresent();
        assertThat(found.get().getToken()).isEqualTo("tok-new");
    }

    @Test
    void findLatestActive_noTokensForUser_returnsEmpty() {
        assertThat(repository.findLatestActiveByUserId(savedUser.getId(), Instant.now()))
                .isEmpty();
    }

    @Test
    void findLatestActive_activeTokenBelongsToOtherUser_returnsEmpty() {
        User other = userRepository.save(User.builder()
                .email("other@example.com")
                .password("hashed-placeholder")
                .firstName("Jane")
                .lastName("Doe")
                .build());
        repository.save(RefreshToken.builder()
                .token("tok-other")
                .user(other)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .build());

        assertThat(repository.findLatestActiveByUserId(savedUser.getId(), Instant.now()))
                .isEmpty();
    }

    // =========================================================================
    // revokeAllByUserId
    // =========================================================================

    @Test
    void revokeAllByUserId_revokesAllActiveTokensForUser() {
        repository.save(activeToken("tok-1"));
        repository.save(activeToken("tok-2"));

        repository.revokeAllByUserId(savedUser.getId());
        em.clear(); // flush first-level cache so reads hit the DB

        assertThat(repository.findAll())
                .hasSize(2)
                .allMatch(RefreshToken::isRevoked);
    }

    @Test
    void revokeAllByUserId_doesNotAffectOtherUsers() {
        User other = userRepository.save(User.builder()
                .email("other@example.com")
                .password("hashed-placeholder")
                .firstName("Jane")
                .lastName("Doe")
                .build());
        repository.save(activeToken("tok-mine"));
        repository.save(RefreshToken.builder()
                .token("tok-other")
                .user(other)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .build());

        repository.revokeAllByUserId(savedUser.getId());
        em.clear();

        assertThat(repository.findByToken("tok-other"))
                .isPresent()
                .get()
                .extracting(RefreshToken::isRevoked)
                .isEqualTo(false);
    }

    @Test
    void revokeAllByUserId_alreadyRevokedToken_remainsRevoked() {
        // The query targets `revoked = false` only, so already-revoked tokens are unaffected
        repository.save(revokedToken("tok-already-revoked"));

        repository.revokeAllByUserId(savedUser.getId());
        em.clear();

        assertThat(repository.findByToken("tok-already-revoked"))
                .isPresent()
                .get()
                .extracting(RefreshToken::isRevoked)
                .isEqualTo(true);
    }

    @Test
    void revokeAllByUserId_noTokens_doesNothing() {
        // Should not throw when user has no tokens
        repository.revokeAllByUserId(savedUser.getId());
        assertThat(repository.findAll()).isEmpty();
    }

    // =========================================================================
    // Constraints
    // =========================================================================

    @Test
    void save_duplicateToken_throwsDataIntegrityViolation() {
        repository.save(activeToken("dup-token"));

        assertThatThrownBy(() -> repository.saveAndFlush(activeToken("dup-token")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void save_setsDefaultValues() {
        RefreshToken saved = repository.save(activeToken("tok-defaults"));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.isRevoked()).isFalse();
        assertThat(saved.getCreatedAt()).isNotNull();
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private RefreshToken activeToken(String token) {
        return RefreshToken.builder()
                .token(token)
                .user(savedUser)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .build();
    }

    private RefreshToken revokedToken(String token) {
        return RefreshToken.builder()
                .token(token)
                .user(savedUser)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(true)
                .build();
    }
}
