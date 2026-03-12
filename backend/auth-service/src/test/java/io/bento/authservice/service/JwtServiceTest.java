package io.bento.authservice.service;

import io.bento.authservice.config.JwtProperties;
import io.bento.authservice.dto.response.UserOrgDto;
import io.bento.authservice.entity.User;
import io.bento.authservice.enums.SystemRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * JwtService is tested with a real instance (no mocks) because its value
 * is in producing a correctly structured, signed JWT — behaviour that
 * can only be verified by actually parsing the token.
 */
class JwtServiceTest {

    // Must be ≥ 32 bytes for HMAC-SHA256
    private static final String TEST_SECRET =
            "test-secret-that-is-at-least-32-bytes-long-for-hs256-algo";
    private static final long ACCESS_EXPIRATION_MS = 900_000L; // 15 min

    private JwtService jwtService;
    private SecretKey secretKey;

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID ORG_ID  = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @BeforeEach
    void setUp() {
        JwtProperties props = new JwtProperties(TEST_SECRET, ACCESS_EXPIRATION_MS, 604_800_000L);
        jwtService = new JwtService(props);
        secretKey = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));
    }

    // =========================================================================
    // generateAccessToken — with org context
    // =========================================================================

    @Test
    void generateAccessToken_withOrg_subjectIsUserId() {
        String token = jwtService.generateAccessToken(user(), orgDto());
        assertThat(parseClaims(token).getSubject()).isEqualTo(USER_ID.toString());
    }

    @Test
    void generateAccessToken_withOrg_containsEmailClaim() {
        String token = jwtService.generateAccessToken(user(), orgDto());
        assertThat(parseClaims(token).get("email", String.class)).isEqualTo("john@example.com");
    }

    @Test
    void generateAccessToken_withOrg_containsSystemRoleClaim() {
        String token = jwtService.generateAccessToken(user(), orgDto());
        assertThat(parseClaims(token).get("systemRole", String.class)).isEqualTo("USER");
    }

    @Test
    void generateAccessToken_withOrg_containsOrgClaims() {
        String token = jwtService.generateAccessToken(user(), orgDto());
        Claims claims = parseClaims(token);

        assertThat(claims.get("orgId", String.class)).isEqualTo(ORG_ID.toString());
        assertThat(claims.get("orgRole", String.class)).isEqualTo("OWNER");
        assertThat(claims.get("orgSlug", String.class)).isEqualTo("acme");
    }

    @Test
    void generateAccessToken_withOrg_expirationIsApproximately15MinutesFromNow() {
        String token = jwtService.generateAccessToken(user(), orgDto());
        Date expiration = parseClaims(token).getExpiration();

        long secondsUntilExpiry = (expiration.getTime() - System.currentTimeMillis()) / 1000;
        assertThat(secondsUntilExpiry).isBetween(890L, 910L);
    }

    @Test
    void generateAccessToken_withOrg_issuedAtIsSetToNow() {
        long beforeMs = System.currentTimeMillis();
        String token = jwtService.generateAccessToken(user(), orgDto());
        long afterMs = System.currentTimeMillis();

        long issuedAtMs = parseClaims(token).getIssuedAt().getTime();
        assertThat(issuedAtMs).isBetween(beforeMs - 1000, afterMs + 1000);
    }

    // =========================================================================
    // generateAccessToken — without org context (null)
    // =========================================================================

    @Test
    void generateAccessToken_nullOrg_doesNotContainOrgClaims() {
        String token = jwtService.generateAccessToken(user(), null);
        Claims claims = parseClaims(token);

        assertThat(claims.get("orgId")).isNull();
        assertThat(claims.get("orgRole")).isNull();
        assertThat(claims.get("orgSlug")).isNull();
    }

    @Test
    void generateAccessToken_nullOrg_stillContainsCoreUserClaims() {
        String token = jwtService.generateAccessToken(user(), null);
        Claims claims = parseClaims(token);

        assertThat(claims.getSubject()).isEqualTo(USER_ID.toString());
        assertThat(claims.get("email", String.class)).isEqualTo("john@example.com");
        assertThat(claims.get("systemRole", String.class)).isEqualTo("USER");
    }

    // =========================================================================
    // generateAccessToken — token integrity
    // =========================================================================

    @Test
    void generateAccessToken_tokenIsSignedAndVerifiable() {
        // If the token was tampered with or signed with a different key,
        // Jwts.parser().verifyWith() would throw — the fact that parseClaims()
        // succeeds proves the signature is valid.
        String token = jwtService.generateAccessToken(user(), orgDto());
        assertThat(parseClaims(token)).isNotNull();
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private User user() {
        return User.builder()
                .id(USER_ID)
                .email("john@example.com")
                .password("hashed")
                .firstName("John")
                .lastName("Doe")
                .systemRole(SystemRole.USER)
                .active(true)
                .emailVerified(false)
                .build();
    }

    private UserOrgDto orgDto() {
        return new UserOrgDto(ORG_ID, "Acme", "acme", "OWNER", null);
    }
}
