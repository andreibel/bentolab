package io.bento.authservice.repository;

import io.bento.authservice.entity.User;
import io.bento.authservice.enums.SystemRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * PASSWORD HASHING NOTE:
 * BCrypt does NOT use a fixed key. There is no "key" stored separately.
 * Each hash contains the salt embedded inside it:
 *
 *   $2a$10$<22-char-salt><31-char-hash>
 *   └──┘ └┘
 *   algo cost
 *
 * The `password` column in the `users` table stores the full hash string.
 * To verify: BCrypt extracts the salt from the stored hash, re-hashes the
 * input with that salt, and compares. No key needed.
 *
 * To see a stored password hash directly:
 *   SELECT email, password FROM users WHERE email = 'user@example.com';
 * The value starts with $2a$10$ (or $2b$12$ depending on strength setting).
 */
@DataJpaTest
@TestPropertySource(properties = "spring.liquibase.enabled=false")
class
UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    private User buildUser(String email) {
        return User.builder()
                .email(email)
                .password("hashed-placeholder")
                .firstName("John")
                .lastName("Doe")
                .systemRole(SystemRole.USER)
                .active(true)
                .emailVerified(false)
                .build();
    }

    // =========================================================================
    // Basic CRUD
    // =========================================================================

    @Test
    void save_persistsUserWithGeneratedId() {
        User saved = userRepository.save(buildUser("john@example.com"));

        assertThat(saved.getId()).isNotNull();
        assertThat(userRepository.findById(saved.getId())).isPresent();
    }

    @Test
    void findByEmail_existingUser_returnsUser() {
        userRepository.save(buildUser("john@example.com"));

        assertThat(userRepository.findByEmail("john@example.com"))
                .isPresent()
                .get()
                .extracting(User::getEmail)
                .isEqualTo("john@example.com");
    }

    @Test
    void findByEmail_unknownEmail_returnsEmpty() {
        assertThat(userRepository.findByEmail("nobody@example.com")).isEmpty();
    }

    @Test
    void existsByEmail_existingUser_returnsTrue() {
        userRepository.save(buildUser("exists@example.com"));

        assertThat(userRepository.existsByEmail("exists@example.com")).isTrue();
    }

    @Test
    void existsByEmail_unknownEmail_returnsFalse() {
        assertThat(userRepository.existsByEmail("nothere@example.com")).isFalse();
    }

    // =========================================================================
    // Constraints
    // =========================================================================

    @Test
    void save_duplicateEmail_throwsDataIntegrityViolation() {
        userRepository.save(buildUser("dup@example.com"));

        assertThatThrownBy(() -> {
            userRepository.saveAndFlush(buildUser("dup@example.com"));
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void defaultValues_areSetOnSave() {
        User saved = userRepository.save(buildUser("defaults@example.com"));

        assertThat(saved.getSystemRole()).isEqualTo(SystemRole.USER);
        assertThat(saved.isActive()).isTrue();
        assertThat(saved.isEmailVerified()).isFalse();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
        assertThat(saved.getCurrentOrgId()).isNull();
        assertThat(saved.getLastLoginAt()).isNull();
    }

    // =========================================================================
    // BCrypt password hashing — verifying what's stored in the DB
    // =========================================================================

    @Test
    void bcrypt_hashFormat_startsWithAlgoPrefix() {
        // The stored hash format: $2a$<cost>$<22-char-salt><31-char-hash>
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hashed = encoder.encode("myPassword123");

        assertThat(hashed).startsWith("$2a$");
        assertThat(hashed).hasSizeGreaterThan(50);
    }

    @Test
    void bcrypt_correctPassword_matchesStoredHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String raw = "password123";
        String hashed = encoder.encode(raw);

        // This is how AuthService.login() verifies the password
        assertThat(encoder.matches(raw, hashed)).isTrue();
    }

    @Test
    void bcrypt_wrongPassword_doesNotMatchStoredHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hashed = encoder.encode("correctPassword");

        assertThat(encoder.matches("wrongPassword", hashed)).isFalse();
    }

    @Test
    void bcrypt_samePasswordEncodedTwice_producesDifferentHashes() {
        // Each call generates a fresh random salt — hashes are never equal
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String raw = "samePassword";

        String hash1 = encoder.encode(raw);
        String hash2 = encoder.encode(raw);

        assertThat(hash1).isNotEqualTo(hash2);
        // But both hashes verify correctly against the raw password
        assertThat(encoder.matches(raw, hash1)).isTrue();
        assertThat(encoder.matches(raw, hash2)).isTrue();
    }

    @Test
    void bcrypt_storedHashInDb_canBeRetrievedAndVerified() {
        // Simulates the full register → login cycle at the DB level
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "securePass99!";
        String hashedPassword = encoder.encode(rawPassword);

        User user = buildUser("hashed@example.com");
        user.setPassword(hashedPassword);
        userRepository.save(user);

        // Retrieve from DB and verify — same as AuthService.login() does
        User found = userRepository.findByEmail("hashed@example.com").orElseThrow();
        assertThat(found.getPassword()).startsWith("$2a$");
        assertThat(encoder.matches(rawPassword, found.getPassword())).isTrue();
        assertThat(encoder.matches("wrongPassword", found.getPassword())).isFalse();
    }
}