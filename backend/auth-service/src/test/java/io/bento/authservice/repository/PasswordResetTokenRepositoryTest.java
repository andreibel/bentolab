package io.bento.authservice.repository;

import io.bento.authservice.entity.PasswordResetToken;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@TestPropertySource(properties = "spring.liquibase.enabled=false")
class PasswordResetTokenRepositoryTest {

    @Autowired private PasswordResetTokenRepository repository;
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
        PasswordResetToken saved = repository.save(unusedToken("tok-abc"));

        assertThat(repository.findByToken("tok-abc"))
                .isPresent()
                .get()
                .extracting(PasswordResetToken::getId)
                .isEqualTo(saved.getId());
    }

    @Test
    void findByToken_unknownToken_returnsEmpty() {
        assertThat(repository.findByToken("does-not-exist")).isEmpty();
    }

    @Test
    void findByToken_usedToken_stillReturnsIt() {
        // findByToken does not filter by `used` — callers check it themselves
        repository.save(usedToken("tok-used"));

        assertThat(repository.findByToken("tok-used")).isPresent();
    }

    @Test
    void findByToken_expiredToken_stillReturnsIt() {
        // findByToken does not filter by expiry — callers check it themselves
        repository.save(PasswordResetToken.builder()
                .user(savedUser)
                .token("tok-expired")
                .expiresAt(Instant.now().minusSeconds(1))
                .used(false)
                .build());

        assertThat(repository.findByToken("tok-expired")).isPresent();
    }

    // =========================================================================
    // invalidateAllByUserId
    // =========================================================================

    @Test
    void invalidateAllByUserId_marksAllUnusedTokensAsUsed() {
        repository.save(unusedToken("tok-1"));
        repository.save(unusedToken("tok-2"));

        repository.invalidateAllByUserId(savedUser.getId());
        em.clear(); // flush first-level cache so reads hit the DB

        assertThat(repository.findAll())
                .hasSize(2)
                .allMatch(PasswordResetToken::isUsed);
    }

    @Test
    void invalidateAllByUserId_doesNotAffectAlreadyUsedTokens() {
        // The query targets `used = false` only — already-used tokens are unchanged
        repository.save(usedToken("tok-already-used"));

        repository.invalidateAllByUserId(savedUser.getId());
        em.clear();

        assertThat(repository.findByToken("tok-already-used"))
                .isPresent()
                .get()
                .extracting(PasswordResetToken::isUsed)
                .isEqualTo(true);
    }

    @Test
    void invalidateAllByUserId_doesNotAffectOtherUsers() {
        User other = userRepository.save(User.builder()
                .email("other@example.com")
                .password("hashed-placeholder")
                .firstName("Jane")
                .lastName("Doe")
                .build());
        repository.save(unusedToken("tok-mine"));
        repository.save(PasswordResetToken.builder()
                .user(other)
                .token("tok-other")
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .used(false)
                .build());

        repository.invalidateAllByUserId(savedUser.getId());
        em.clear();

        assertThat(repository.findByToken("tok-other"))
                .isPresent()
                .get()
                .extracting(PasswordResetToken::isUsed)
                .isEqualTo(false);
    }

    @Test
    void invalidateAllByUserId_noTokens_doesNothing() {
        repository.invalidateAllByUserId(savedUser.getId());
        assertThat(repository.findAll()).isEmpty();
    }

    // =========================================================================
    // Constraints & defaults
    // =========================================================================

    @Test
    void save_setsDefaultValues() {
        PasswordResetToken saved = repository.save(unusedToken("tok-defaults"));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.isUsed()).isFalse();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getExpiresAt()).isNotNull();
    }

    @Test
    void save_duplicateToken_throwsDataIntegrityViolation() {
        repository.save(unusedToken("dup-tok"));

        assertThatThrownBy(() -> repository.saveAndFlush(unusedToken("dup-tok")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private PasswordResetToken unusedToken(String token) {
        return PasswordResetToken.builder()
                .user(savedUser)
                .token(token)
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .used(false)
                .build();
    }

    private PasswordResetToken usedToken(String token) {
        return PasswordResetToken.builder()
                .user(savedUser)
                .token(token)
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .used(true)
                .build();
    }
}
