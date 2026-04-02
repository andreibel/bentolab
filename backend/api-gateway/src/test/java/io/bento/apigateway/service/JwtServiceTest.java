package io.bento.apigateway.service;

import io.bento.apigateway.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class JwtServiceTest {

    // Must be >= 32 bytes for HMAC-SHA256
    private static final String SECRET = "test-secret-key-at-least-32-bytes!!";

    private JwtService jwtService;
    private SecretKey key;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(new JwtProperties(SECRET));
        key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void extractClaims_validToken_returnsSubject() {
        UUID userId = UUID.randomUUID();
        String token = buildToken(userId, false);

        Claims claims = jwtService.extractClaims(token);

        assertThat(claims.getSubject()).isEqualTo(userId.toString());
    }

    @Test
    void extractClaims_customClaims_returned() {
        UUID userId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        String token = Jwts.builder()
                .subject(userId.toString())
                .issuedAt(new Date())
                .expiration(Date.from(Instant.now().plusSeconds(3600)))
                .claim("orgId", orgId.toString())
                .claim("orgRole", "ADMIN")
                .claim("orgSlug", "acme")
                .claim("email", "user@acme.com")
                .signWith(key)
                .compact();

        Claims claims = jwtService.extractClaims(token);

        assertThat(claims.get("orgId", String.class)).isEqualTo(orgId.toString());
        assertThat(claims.get("orgRole", String.class)).isEqualTo("ADMIN");
        assertThat(claims.get("orgSlug", String.class)).isEqualTo("acme");
        assertThat(claims.get("email", String.class)).isEqualTo("user@acme.com");
    }

    @Test
    void extractClaims_expiredToken_throwsJwtException() {
        UUID userId = UUID.randomUUID();
        String token = buildToken(userId, true);

        assertThatThrownBy(() -> jwtService.extractClaims(token))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void extractClaims_wrongSignature_throwsJwtException() {
        String otherSecret = "other-secret-key-at-least-32-bytes!!";
        SecretKey otherKey = Keys.hmacShaKeyFor(otherSecret.getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder()
                .subject(UUID.randomUUID().toString())
                .issuedAt(new Date())
                .expiration(Date.from(Instant.now().plusSeconds(3600)))
                .signWith(otherKey)
                .compact();

        assertThatThrownBy(() -> jwtService.extractClaims(token))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void extractClaims_tamperedPayload_throwsJwtException() {
        String token = buildToken(UUID.randomUUID(), false);
        // Corrupt the payload segment
        String[] parts = token.split("\\.");
        String tampered = parts[0] + ".YWJj." + parts[2];

        assertThatThrownBy(() -> jwtService.extractClaims(tampered))
                .isInstanceOf(JwtException.class);
    }

    // ---- helpers ----

    private String buildToken(UUID userId, boolean expired) {
        Date iat = expired
                ? Date.from(Instant.now().minusSeconds(3600))
                : new Date();
        Date exp = expired
                ? Date.from(Instant.now().minusSeconds(1))
                : Date.from(Instant.now().plusSeconds(3600));
        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(iat)
                .expiration(exp)
                .signWith(key)
                .compact();
    }
}
