package io.bento.authservice.controller;

import io.bento.security.GatewayAuthProperties;
import io.bento.authservice.config.SecurityConfig;
import io.bento.authservice.dto.response.UserDto;
import io.bento.authservice.enums.SystemRole;
import io.bento.authservice.service.UserService;
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
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
        "internal.gateway-secret=test-secret",
        "jwt.secret=test-secret-that-is-at-least-32-bytes-long",
        "jwt.access-token-expiration=900000",
        "jwt.refresh-token-expiration=604800000",
        "auth.pepper=test-pepper"
})
class UserControllerTest {

    private static final String GATEWAY_SECRET = "test-secret";
    private static final UUID   USER_ID        = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Autowired private MockMvc mockMvc;

    @MockitoBean private UserService userService;

    @TestConfiguration
    @EnableConfigurationProperties(GatewayAuthProperties.class)
    static class TestConfig {}

    // =========================================================================
    // GET /api/users/me
    // =========================================================================

    @Test
    void getCurrentUser_returns200WithUserDto() throws Exception {
        when(userService.getCurrentUser(USER_ID)).thenReturn(userDto());

        mockMvc.perform(get("/api/users/me")
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .header("X-User-Id", USER_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("john@example.com"))
                .andExpect(jsonPath("$.firstName").value("John"));
    }

    @Test
    void getCurrentUser_missingGatewaySecret_returns401() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("X-User-Id", USER_ID.toString()))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // PATCH /api/users/me
    // =========================================================================

    @Test
    void updateCurrentUser_validRequest_returns200() throws Exception {
        UserDto updated = new UserDto(USER_ID, "john@example.com", "Johnny", "Doe",
                null, SystemRole.USER, false, null, null, Instant.now());
        when(userService.updateCurrentUser(eq(USER_ID), any())).thenReturn(updated);

        mockMvc.perform(patch("/api/users/me")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .header("X-User-Id", USER_ID.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"Johnny"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Johnny"));
    }

    @Test
    void updateCurrentUser_firstNameTooLong_returns400() throws Exception {
        String tooLong = "A".repeat(101);

        mockMvc.perform(patch("/api/users/me")
                        .with(csrf())
                        .header("X-Internal-Secret", GATEWAY_SECRET)
                        .header("X-User-Id", USER_ID.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"%s"}""".formatted(tooLong)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateCurrentUser_missingGatewaySecret_returns401() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("X-User-Id", USER_ID.toString()))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // Helper
    // =========================================================================

    private UserDto userDto() {
        return new UserDto(USER_ID, "john@example.com", "John", "Doe",
                null, SystemRole.USER, false, null, null, Instant.now());
    }
}
