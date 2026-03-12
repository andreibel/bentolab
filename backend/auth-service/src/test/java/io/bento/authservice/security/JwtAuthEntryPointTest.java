package io.bento.authservice.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;

import static org.assertj.core.api.Assertions.assertThat;

class JwtAuthEntryPointTest {

    private final JwtAuthEntryPoint entryPoint = new JwtAuthEntryPoint();
    private final MockHttpServletRequest  request   = new MockHttpServletRequest();
    private final MockHttpServletResponse response  = new MockHttpServletResponse();
    private final BadCredentialsException exception = new BadCredentialsException("test");

    @Test
    void commence_sets401Status() throws Exception {
        entryPoint.commence(request, response, exception);

        assertThat(response.getStatus()).isEqualTo(401);
    }

    @Test
    void commence_setsJsonContentType() throws Exception {
        entryPoint.commence(request, response, exception);

        assertThat(response.getContentType()).contains("application/json");
    }

    @Test
    void commence_writesUnauthorizedBody() throws Exception {
        entryPoint.commence(request, response, exception);

        String body = response.getContentAsString();
        assertThat(body).contains("401");
        assertThat(body).contains("Unauthorized");
        assertThat(body).contains("Authentication required");
    }
}
