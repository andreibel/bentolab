package io.bento.orgservice.controller;

import io.bento.security.GatewayAuthProperties;
import io.bento.security.SecurityConfig;
import io.bento.orgservice.dto.response.OrgPermissionResponse;
import io.bento.orgservice.enums.OrgPermissionKey;
import io.bento.orgservice.exception.OrgAccessDeniedException;
import io.bento.orgservice.service.OrgPermissionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(OrgPermissionController.class)
@Import(SecurityConfig.class)
class OrgPermissionControllerTest {

    private static final String SECRET = "test-secret";
    private static final UUID   ORG_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Autowired private MockMvc mockMvc;
    @MockitoBean private OrgPermissionService orgPermissionService;

    @TestConfiguration
    @EnableConfigurationProperties(GatewayAuthProperties.class)
    static class TestConfig {}

    // =========================================================================
    // GET /api/orgs/{orgId}/permissions
    // =========================================================================

    @Test
    void getPermissions_validRequest_returns200() throws Exception {
        when(orgPermissionService.getPermissions(ORG_ID))
                .thenReturn(List.of(permissionResponse()));

        mockMvc.perform(get("/api/orgs/{orgId}/permissions", ORG_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-Org-Id", ORG_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].permissionKey").value("VIEW_MEMBERS"));
    }

    @Test
    void getPermissions_noSecret_returns401() throws Exception {
        mockMvc.perform(get("/api/orgs/{orgId}/permissions", ORG_ID))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getPermissions_emptyList_returns200EmptyArray() throws Exception {
        when(orgPermissionService.getPermissions(ORG_ID)).thenReturn(List.of());

        mockMvc.perform(get("/api/orgs/{orgId}/permissions", ORG_ID)
                        .header("X-Internal-Secret", SECRET))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // =========================================================================
    // PUT /api/orgs/{orgId}/permissions/{key}
    // =========================================================================

    @Test
    void updatePermission_asOwner_returns200() throws Exception {
        when(orgPermissionService.updatePermission(any(), any(), any(), any()))
                .thenReturn(permissionResponse());

        mockMvc.perform(put("/api/orgs/{orgId}/permissions/{key}", ORG_ID, "VIEW_MEMBERS")
                        .header("X-Internal-Secret", SECRET)
                        .header("X-Org-Role", "ORG_OWNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"allowedRoles":["ORG_OWNER","ORG_ADMIN","ORG_MEMBER"]}"""))
                .andExpect(status().isOk());
    }

    @Test
    void updatePermission_nullAllowedRolesField_returns400() throws Exception {
        // allowedRoles is @NotNull — sending null triggers validation → 400
        mockMvc.perform(put("/api/orgs/{orgId}/permissions/{key}", ORG_ID, "VIEW_MEMBERS")
                        .header("X-Internal-Secret", SECRET)
                        .header("X-Org-Role", "ORG_OWNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"allowedRoles\":null}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updatePermission_serviceThrowsAccessDenied_returns403() throws Exception {
        when(orgPermissionService.updatePermission(any(), any(), any(), any()))
                .thenThrow(new OrgAccessDeniedException("only owner"));

        mockMvc.perform(put("/api/orgs/{orgId}/permissions/{key}", ORG_ID, "VIEW_MEMBERS")
                        .header("X-Internal-Secret", SECRET)
                        .header("X-Org-Role", "ORG_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"allowedRoles":["ORG_OWNER"]}"""))
                .andExpect(status().isForbidden());
    }

    @Test
    void updatePermission_missingAllowedRoles_returns400() throws Exception {
        mockMvc.perform(put("/api/orgs/{orgId}/permissions/{key}", ORG_ID, "VIEW_MEMBERS")
                        .header("X-Internal-Secret", SECRET)
                        .header("X-Org-Role", "ORG_OWNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private OrgPermissionResponse permissionResponse() {
        OrgPermissionKey key = OrgPermissionKey.VIEW_MEMBERS;
        return new OrgPermissionResponse(
                key.name(), key.getLabel(), key.getDescription(), key.isLocked(),
                Set.of("ORG_OWNER", "ORG_ADMIN", "ORG_MEMBER"));
    }
}
