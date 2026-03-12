package io.bento.authservice.controller;

import io.bento.authservice.config.GatewayAuthProperties;
import io.bento.authservice.config.SecurityConfig;
import io.bento.authservice.dto.response.AuthResponse;
import io.bento.authservice.dto.response.TokenResponse;
import io.bento.authservice.dto.response.UserDto;
import io.bento.authservice.dto.response.UserOrgDto;
import io.bento.authservice.enums.SystemRole;
import io.bento.authservice.service.AuthService;
import io.bento.authservice.service.EmailVerificationService;
import io.bento.authservice.service.PasswordResetService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AuthController is tested through MockMvc with the real GatewayAuthFilter active.
 *
 * @WebMvcTest loads Spring Security auto-configuration (CSRF enabled by default).
 * Our SecurityConfig disables CSRF in production, but that config is not loaded in
 * the test slice. We therefore add csrf() to all mutating requests so the CSRF filter
 * passes through and our GatewayAuthFilter can run.
 * Every request must include X-Internal-Secret to pass the gateway check.
 * Protected endpoints (switch-org, logout) additionally require X-User-Id.
 */
@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
        "internal.gateway-secret=test-secret",
        "jwt.secret=test-secret-that-is-at-least-32-bytes-long",
        "jwt.access-token-expiration=900000",
        "jwt.refresh-token-expiration=604800000",
        "auth.pepper=test-pepper"
})
class AuthControllerTest {

    private static final String GATEWAY_SECRET = "test-secret";
    private static final UUID   USER_ID        = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID   ORG_ID         = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @Autowired private MockMvc mockMvc;

    @MockitoBean private AuthService authService;
    @MockitoBean private EmailVerificationService emailVerificationService;
    @MockitoBean private PasswordResetService passwordResetService;

    @TestConfiguration
    @EnableConfigurationProperties(GatewayAuthProperties.class)
    static class TestConfig {}

    // =========================================================================
    // POST /api/auth/register
    // =========================================================================

    @Test
    void register_validRequest_returns201() throws Exception {
        when(authService.register(any())).thenReturn(authResponse());

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"john@example.com","password":"secret123",
                                 "firstName":"John","lastName":"Doe"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").value("access-token"));
    }

    @Test
    void register_invalidEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"not-an-email","password":"secret123",
                                 "firstName":"John","lastName":"Doe"}"""))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_passwordTooShort_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"john@example.com","password":"short",
                                 "firstName":"John","lastName":"Doe"}"""))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_missingFirstName_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"john@example.com","password":"secret123",
                                 "lastName":"Doe"}"""))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // POST /api/auth/login
    // =========================================================================

    @Test
    void login_validRequest_returns200() throws Exception {
        when(authService.login(any())).thenReturn(authResponse());

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"john@example.com","password":"secret123"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refreshToken").value("refresh-token"));
    }

    @Test
    void login_invalidEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"bad","password":"secret123"}"""))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // POST /api/auth/refresh
    // =========================================================================

    @Test
    void refresh_validRequest_returns200() throws Exception {
        when(authService.refresh(anyString(), any())).thenReturn(new TokenResponse("new-access", "refresh-token"));

        mockMvc.perform(post("/api/auth/refresh")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"refreshToken":"refresh-token"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new-access"));
    }

    @Test
    void refresh_missingRefreshToken_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // POST /api/auth/logout
    // =========================================================================

    @Test
    void logout_validRequest_returns204() throws Exception {
        doNothing().when(authService).logout(anyString());

        mockMvc.perform(post("/api/auth/logout")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .header("X-User-Id", USER_ID.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"refreshToken":"refresh-token"}"""))
                .andExpect(status().isNoContent());
    }

    // =========================================================================
    // POST /api/auth/switch-org
    // =========================================================================

    @Test
    void switchOrg_validRequest_returns200() throws Exception {
        when(authService.switchOrg(any(), any())).thenReturn(new TokenResponse("new-access", "refresh-token"));

        mockMvc.perform(post("/api/auth/switch-org")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .header("X-User-Id", USER_ID.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"orgId":"%s"}""".formatted(ORG_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new-access"));
    }

    @Test
    void switchOrg_missingOrgId_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/switch-org")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .header("X-User-Id", USER_ID.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // GET /api/auth/verify-email  (GET — no CSRF needed)
    // =========================================================================

    @Test
    void verifyEmail_validToken_returns200() throws Exception {
        doNothing().when(emailVerificationService).verify(anyString());

        mockMvc.perform(get("/api/auth/verify-email")
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .param("token", "some-token"))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // POST /api/auth/resend-verification
    // =========================================================================

    @Test
    void resendVerification_validEmail_returns200() throws Exception {
        doNothing().when(emailVerificationService).resendVerification(anyString());

        mockMvc.perform(post("/api/auth/resend-verification")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"john@example.com"}"""))
                .andExpect(status().isOk());
    }

    @Test
    void resendVerification_invalidEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/resend-verification")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"not-valid"}"""))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // POST /api/auth/forgot-password
    // =========================================================================

    @Test
    void forgotPassword_validEmail_returns200() throws Exception {
        doNothing().when(passwordResetService).requestReset(anyString());

        mockMvc.perform(post("/api/auth/forgot-password")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"john@example.com"}"""))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // POST /api/auth/reset-password
    // =========================================================================

    @Test
    void resetPassword_validRequest_returns200() throws Exception {
        doNothing().when(passwordResetService).resetPassword(anyString(), anyString());

        mockMvc.perform(post("/api/auth/reset-password")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"reset-tok","newPassword":"newSecret123"}"""))
                .andExpect(status().isOk());
    }

    @Test
    void resetPassword_shortPassword_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/reset-password")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"tok","newPassword":"short"}"""))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // GatewayAuthFilter integration — GET is fine without CSRF
    // =========================================================================

    @Test
    void anyEndpoint_missingGatewaySecret_returns401() throws Exception {
        mockMvc.perform(get("/api/auth/verify-email")
                        .param("token", "tok"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void anyEndpoint_wrongGatewaySecret_returns401() throws Exception {
        mockMvc.perform(get("/api/auth/verify-email")
                        .header("X-Internal-Secret", "wrong-secret")
                        .param("token", "tok"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // Helper
    // =========================================================================

    private AuthResponse authResponse() {
        UserDto user = new UserDto(USER_ID, "john@example.com", "John", "Doe",
                null, SystemRole.USER, false, null, null, Instant.now());
        UserOrgDto org = new UserOrgDto(ORG_ID, "Acme", "acme", "OWNER", null);
        return new AuthResponse("access-token", "refresh-token", user, List.of(org));
    }
}
