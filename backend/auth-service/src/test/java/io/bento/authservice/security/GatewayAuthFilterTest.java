package io.bento.authservice.security;

import io.bento.authservice.config.GatewayAuthProperties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * GatewayAuthFilter is tested directly (no Spring context) using Spring's
 * mock Servlet objects. Each test exercises one distinct code path.
 */
class GatewayAuthFilterTest {

    private static final String CORRECT_SECRET = "correct-secret";

    private GatewayAuthFilter filter;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private MockFilterChain chain;

    @BeforeEach
    void setUp() {
        filter = new GatewayAuthFilter(new GatewayAuthProperties(CORRECT_SECRET));
        request  = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        chain    = new MockFilterChain();
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    // =========================================================================
    // Secret validation
    // =========================================================================

    @Test
    void missingSecret_returns401() throws Exception {
        // no X-Internal-Secret header
        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
    }

    @Test
    void wrongSecret_returns401() throws Exception {
        request.addHeader("X-Internal-Secret", "wrong-secret");

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
    }

    @Test
    void wrongSecret_writesJsonErrorBody() throws Exception {
        request.addHeader("X-Internal-Secret", "wrong-secret");

        filter.doFilter(request, response, chain);

        assertThat(response.getContentAsString()).contains("Direct service access not allowed");
    }

    @Test
    void wrongSecret_setsJsonContentType() throws Exception {
        request.addHeader("X-Internal-Secret", "wrong-secret");

        filter.doFilter(request, response, chain);

        assertThat(response.getContentType()).contains("application/json");
    }

    @Test
    void wrongSecret_doesNotContinueFilterChain() throws Exception {
        request.addHeader("X-Internal-Secret", "wrong-secret");

        filter.doFilter(request, response, chain);

        // MockFilterChain exposes the request only if doFilter was called on it
        assertThat(chain.getRequest()).isNull();
    }

    // =========================================================================
    // Correct secret — no X-User-Id (public endpoint)
    // =========================================================================

    @Test
    void correctSecret_noUserId_continuesFilterChain() throws Exception {
        request.addHeader("X-Internal-Secret", CORRECT_SECRET);

        filter.doFilter(request, response, chain);

        assertThat(chain.getRequest()).isNotNull();
    }

    @Test
    void correctSecret_noUserId_securityContextRemainsAnonymous() throws Exception {
        request.addHeader("X-Internal-Secret", CORRECT_SECRET);

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void correctSecret_noUserId_returns200() throws Exception {
        request.addHeader("X-Internal-Secret", CORRECT_SECRET);

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
    }

    // =========================================================================
    // Correct secret — with valid X-User-Id (authenticated endpoint)
    // =========================================================================

    @Test
    void correctSecret_validUserId_populatesSecurityContextWithUUID() throws Exception {
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        request.addHeader("X-Internal-Secret", CORRECT_SECRET);
        request.addHeader("X-User-Id", userId.toString());

        filter.doFilter(request, response, chain);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        assertThat(principal).isEqualTo(userId);
    }

    @Test
    void correctSecret_validUserId_continuesFilterChain() throws Exception {
        request.addHeader("X-Internal-Secret", CORRECT_SECRET);
        request.addHeader("X-User-Id", UUID.randomUUID().toString());

        filter.doFilter(request, response, chain);

        assertThat(chain.getRequest()).isNotNull();
    }

    // =========================================================================
    // Correct secret — malformed X-User-Id (treated as anonymous)
    // =========================================================================

    @Test
    void correctSecret_malformedUserId_continuesFilterChain() throws Exception {
        request.addHeader("X-Internal-Secret", CORRECT_SECRET);
        request.addHeader("X-User-Id", "not-a-uuid");

        filter.doFilter(request, response, chain);

        assertThat(chain.getRequest()).isNotNull();
    }

    @Test
    void correctSecret_malformedUserId_securityContextRemainsAnonymous() throws Exception {
        request.addHeader("X-Internal-Secret", CORRECT_SECRET);
        request.addHeader("X-User-Id", "not-a-uuid");

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void correctSecret_blankUserId_securityContextRemainsAnonymous() throws Exception {
        request.addHeader("X-Internal-Secret", CORRECT_SECRET);
        request.addHeader("X-User-Id", "   ");

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}
