package io.bento.apigateway.filter;

import io.bento.apigateway.config.GatewayAuthProperty;
import io.bento.apigateway.config.GatewayProperties;
import io.bento.apigateway.service.JwtService;
import io.bento.apigateway.service.StaleTokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JwtAuthFilterTest {

    private static final String INTERNAL_SECRET = "test-internal-secret";
    private static final String BEARER_TOKEN = "some.jwt.token";

    @Mock JwtService jwtService;
    @Mock GatewayAuthProperty gatewayAuthProperty;
    @Mock GatewayProperties gatewayProperties;
    @Mock StaleTokenService staleTokenService;
    @Mock GatewayFilterChain chain;
    @Mock Claims claims;

    JwtAuthFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthFilter(jwtService, gatewayAuthProperty, gatewayProperties, staleTokenService);
        when(gatewayAuthProperty.gatewaySecret()).thenReturn(INTERNAL_SECRET);
        when(gatewayProperties.publicPaths()).thenReturn(List.of("/api/auth/**"));
        when(chain.filter(any())).thenReturn(Mono.empty());
    }

    // ---- public paths ----

    @Test
    void publicPath_forwardsWithInternalSecretNoJwtRequired() {
        MockServerWebExchange exchange = exchange(MockServerHttpRequest.get("/api/auth/login").build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        ServerWebExchange forwarded = captureForwarded();
        assertThat(forwarded.getRequest().getHeaders().getFirst("X-Internal-Secret"))
                .isEqualTo(INTERNAL_SECRET);
        verify(jwtService, never()).extractClaims(anyString());
    }

    @Test
    void publicPath_nestedPath_alsoForwarded() {
        MockServerWebExchange exchange = exchange(MockServerHttpRequest.post("/api/auth/register").build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        verify(chain).filter(any());
    }

    // ---- missing / malformed Authorization header ----

    @Test
    void protectedPath_noAuthHeader_returns401() {
        MockServerWebExchange exchange = exchange(MockServerHttpRequest.get("/api/org/members").build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(chain, never()).filter(any());
    }

    @Test
    void protectedPath_authHeaderNotBearer_returns401() {
        MockServerWebExchange exchange = exchange(
                MockServerHttpRequest.get("/api/org/members")
                        .header(HttpHeaders.AUTHORIZATION, "Basic dXNlcjpwYXNz")
                        .build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(chain, never()).filter(any());
    }

    @Test
    void protectedPath_invalidJwt_returns401() {
        when(jwtService.extractClaims(BEARER_TOKEN)).thenThrow(new JwtException("bad token"));
        MockServerWebExchange exchange = exchange(
                MockServerHttpRequest.get("/api/org/members")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + BEARER_TOKEN)
                        .build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(chain, never()).filter(any());
    }

    // ---- valid JWT, no org context ----

    @Test
    void validJwt_noOrgContext_forwardsWithUserAndSecretHeaders() {
        String userId = UUID.randomUUID().toString();
        setupClaims(userId, null, null, null, "user@example.com");
        when(jwtService.extractClaims(BEARER_TOKEN)).thenReturn(claims);

        MockServerWebExchange exchange = exchange(
                MockServerHttpRequest.get("/api/org/members")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + BEARER_TOKEN)
                        .build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        ServerWebExchange forwarded = captureForwarded();
        assertThat(forwarded.getRequest().getHeaders().getFirst("X-User-Id")).isEqualTo(userId);
        assertThat(forwarded.getRequest().getHeaders().getFirst("X-Internal-Secret")).isEqualTo(INTERNAL_SECRET);
        assertThat(forwarded.getRequest().getHeaders().getFirst("X-Org-Id")).isNull();
        verify(staleTokenService, never()).getStaleSince(anyString(), anyString());
    }

    @Test
    void validJwt_withEmailClaim_forwardsEmailHeader() {
        String userId = UUID.randomUUID().toString();
        setupClaims(userId, null, null, null, "user@example.com");
        when(jwtService.extractClaims(BEARER_TOKEN)).thenReturn(claims);

        MockServerWebExchange exchange = exchange(
                MockServerHttpRequest.get("/api/org/members")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + BEARER_TOKEN)
                        .build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(captureForwarded().getRequest().getHeaders().getFirst("X-User-Email"))
                .isEqualTo("user@example.com");
    }

    // ---- stale token checks ----

    @Test
    void validJwt_withOrgContext_notStale_forwardsWithOrgHeaders() {
        String userId = UUID.randomUUID().toString();
        String orgId = UUID.randomUUID().toString();
        setupClaims(userId, orgId, "MEMBER", "acme", null);
        when(jwtService.extractClaims(BEARER_TOKEN)).thenReturn(claims);
        when(staleTokenService.getStaleSince(userId, orgId)).thenReturn(Mono.empty());

        MockServerWebExchange exchange = exchange(
                MockServerHttpRequest.get("/api/board/boards")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + BEARER_TOKEN)
                        .build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        ServerWebExchange forwarded = captureForwarded();
        assertThat(forwarded.getRequest().getHeaders().getFirst("X-Org-Id")).isEqualTo(orgId);
        assertThat(forwarded.getRequest().getHeaders().getFirst("X-Org-Role")).isEqualTo("MEMBER");
        assertThat(forwarded.getRequest().getHeaders().getFirst("X-Org-Slug")).isEqualTo("acme");
    }

    @Test
    void validJwt_withOrgContext_tokenStale_returnsTokenStaleError() {
        String userId = UUID.randomUUID().toString();
        String orgId = UUID.randomUUID().toString();
        // Token issued 10 minutes ago, stale event happened 5 minutes ago → stale
        Instant issuedAt = Instant.now().minusSeconds(600);
        Instant staleSince = Instant.now().minusSeconds(300);
        setupClaimsWithIssuedAt(userId, orgId, issuedAt);
        when(jwtService.extractClaims(BEARER_TOKEN)).thenReturn(claims);
        when(staleTokenService.getStaleSince(userId, orgId)).thenReturn(Mono.just(staleSince));

        MockServerWebExchange exchange = exchange(
                MockServerHttpRequest.get("/api/board/boards")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + BEARER_TOKEN)
                        .build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(chain, never()).filter(any());
    }

    @Test
    void validJwt_withOrgContext_freshAfterStaleEvent_forwards() {
        String userId = UUID.randomUUID().toString();
        String orgId = UUID.randomUUID().toString();
        // Token issued 1 minute ago, stale event happened 5 minutes ago → token is newer → OK
        Instant issuedAt = Instant.now().minusSeconds(60);
        Instant staleSince = Instant.now().minusSeconds(300);
        setupClaimsWithIssuedAt(userId, orgId, issuedAt);
        when(jwtService.extractClaims(BEARER_TOKEN)).thenReturn(claims);
        when(staleTokenService.getStaleSince(userId, orgId)).thenReturn(Mono.just(staleSince));

        MockServerWebExchange exchange = exchange(
                MockServerHttpRequest.get("/api/board/boards")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + BEARER_TOKEN)
                        .build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        verify(chain).filter(any());
    }

    @Test
    void redisError_allowsRequestThrough() {
        String userId = UUID.randomUUID().toString();
        String orgId = UUID.randomUUID().toString();
        setupClaimsWithIssuedAt(userId, orgId, Instant.now().minusSeconds(60));
        when(jwtService.extractClaims(BEARER_TOKEN)).thenReturn(claims);
        when(staleTokenService.getStaleSince(userId, orgId))
                .thenReturn(Mono.error(new RuntimeException("Redis down")));

        MockServerWebExchange exchange = exchange(
                MockServerHttpRequest.get("/api/board/boards")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + BEARER_TOKEN)
                        .build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        // Redis errors are swallowed — request goes through
        verify(chain).filter(any());
    }

    // ---- WebSocket token fallback ----

    @Test
    void websocket_tokenQueryParam_usedAsFallback_whenNoAuthHeader() {
        String userId = UUID.randomUUID().toString();
        setupClaims(userId, null, null, null, null);
        when(jwtService.extractClaims(BEARER_TOKEN)).thenReturn(claims);

        MockServerWebExchange exchange = exchange(
                MockServerHttpRequest.get("/ws/board?token=" + BEARER_TOKEN).build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        verify(jwtService).extractClaims(BEARER_TOKEN);
        verify(chain).filter(any());
    }

    @Test
    void websocket_blankTokenQueryParam_returns401() {
        MockServerWebExchange exchange = exchange(
                MockServerHttpRequest.get("/ws/board?token=").build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(chain, never()).filter(any());
    }

    // ---- helpers ----

    private MockServerWebExchange exchange(MockServerHttpRequest request) {
        return MockServerWebExchange.from(request);
    }

    private ServerWebExchange captureForwarded() {
        ArgumentCaptor<ServerWebExchange> captor = ArgumentCaptor.forClass(ServerWebExchange.class);
        verify(chain).filter(captor.capture());
        return captor.getValue();
    }

    private void setupClaims(String userId, String orgId, String orgRole, String orgSlug, String email) {
        when(claims.getSubject()).thenReturn(userId);
        when(claims.get("orgId", String.class)).thenReturn(orgId);
        when(claims.get("orgRole", String.class)).thenReturn(orgRole);
        when(claims.get("orgSlug", String.class)).thenReturn(orgSlug);
        when(claims.get("email", String.class)).thenReturn(email);
        if (orgId != null) {
            when(claims.getIssuedAt()).thenReturn(Date.from(Instant.now().minusSeconds(60)));
        }
    }

    private void setupClaimsWithIssuedAt(String userId, String orgId, Instant issuedAt) {
        when(claims.getSubject()).thenReturn(userId);
        when(claims.get("orgId", String.class)).thenReturn(orgId);
        when(claims.get("orgRole", String.class)).thenReturn("MEMBER");
        when(claims.get("orgSlug", String.class)).thenReturn("acme");
        when(claims.get("email", String.class)).thenReturn(null);
        when(claims.getIssuedAt()).thenReturn(Date.from(issuedAt));
    }
}
