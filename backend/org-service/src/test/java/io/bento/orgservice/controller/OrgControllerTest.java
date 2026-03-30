package io.bento.orgservice.controller;

import io.bento.security.GatewayAuthProperties;
import io.bento.security.SecurityConfig;
import io.bento.orgservice.dto.response.OrgResponse;
import io.bento.orgservice.enums.OrgPlan;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.exception.OrgAccessDeniedException;
import io.bento.orgservice.exception.OrgNotFoundException;
import io.bento.orgservice.exception.SlugAlreadyExistsException;
import io.bento.orgservice.service.OrgService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(OrgController.class)
@Import(SecurityConfig.class)
class OrgControllerTest {

    private static final String SECRET  = "test-secret";
    private static final UUID   USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID   ORG_ID  = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @Autowired private MockMvc mockMvc;
    @MockitoBean private OrgService orgService;

    @TestConfiguration
    @EnableConfigurationProperties(GatewayAuthProperties.class)
    static class TestConfig {}

    // =========================================================================
    // POST /api/orgs
    // =========================================================================

    @Test
    void createOrg_validRequest_returns201() throws Exception {
        when(orgService.createOrg(any(), any())).thenReturn(orgResponse());

        mockMvc.perform(post("/api/orgs")
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Acme Corp","slug":"acme-corp"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value("acme"));
    }

    @Test
    void createOrg_missingGatewaySecret_returns401() throws Exception {
        mockMvc.perform(post("/api/orgs")
                        .header("X-User-Id", USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Acme Corp","slug":"acme-corp"}"""))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createOrg_invalidSlugPattern_returns400() throws Exception {
        mockMvc.perform(post("/api/orgs")
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Acme Corp","slug":"Acme Corp With Spaces"}"""))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createOrg_missingName_returns400() throws Exception {
        mockMvc.perform(post("/api/orgs")
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"slug":"acme-corp"}"""))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createOrg_serviceThrowsSlugExists_returns409() throws Exception {
        when(orgService.createOrg(any(), any()))
                .thenThrow(new SlugAlreadyExistsException("slug taken"));

        mockMvc.perform(post("/api/orgs")
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Acme","slug":"acme"}"""))
                .andExpect(status().isConflict());
    }

    // =========================================================================
    // GET /api/orgs/me
    // =========================================================================

    @Test
    void getMyOrgs_validRequest_returns200() throws Exception {
        when(orgService.getMyOrgs(USER_ID)).thenReturn(List.of(orgResponse()));

        mockMvc.perform(get("/api/orgs/me")
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", USER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").value("acme"));
    }

    @Test
    void getMyOrgs_noSecret_returns401() throws Exception {
        mockMvc.perform(get("/api/orgs/me")
                        .header("X-User-Id", USER_ID))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // GET /api/orgs/{orgId}
    // =========================================================================

    @Test
    void getOrgById_validRequest_returns200() throws Exception {
        when(orgService.getOrgById(ORG_ID)).thenReturn(orgResponse());

        mockMvc.perform(get("/api/orgs/{orgId}", ORG_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", USER_ID)
                        .header("X-Org-Id", ORG_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(ORG_ID.toString()));
    }

    @Test
    void getOrgById_serviceThrowsNotFound_returns404() throws Exception {
        when(orgService.getOrgById(ORG_ID)).thenThrow(new OrgNotFoundException("not found"));

        mockMvc.perform(get("/api/orgs/{orgId}", ORG_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", USER_ID))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // PATCH /api/orgs/{orgId}
    // =========================================================================

    @Test
    void updateOrg_validRequest_returns200() throws Exception {
        when(orgService.updateOrg(any(), any(), any())).thenReturn(orgResponse());

        mockMvc.perform(patch("/api/orgs/{orgId}", ORG_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", USER_ID)
                        .header("X-Org-Role", "ORG_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Updated Name"}"""))
                .andExpect(status().isOk());
    }

    @Test
    void updateOrg_serviceThrowsAccessDenied_returns403() throws Exception {
        when(orgService.updateOrg(any(), any(), any()))
                .thenThrow(new OrgAccessDeniedException("forbidden"));

        mockMvc.perform(patch("/api/orgs/{orgId}", ORG_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", USER_ID)
                        .header("X-Org-Role", "ORG_MEMBER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Updated"}"""))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // PATCH /api/orgs/{orgId}/settings
    // =========================================================================

    @Test
    void updateOrgSettings_validRequest_returns200() throws Exception {
        when(orgService.updateOrgSettings(any(), any(), any())).thenReturn(orgResponse());

        mockMvc.perform(patch("/api/orgs/{orgId}/settings", ORG_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-Org-Role", "ORG_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"maxUsers":50}"""))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // POST /api/orgs/{orgId}/transfer
    // =========================================================================

    @Test
    void transferOwnership_validRequest_returns204() throws Exception {
        UUID newOwner = UUID.randomUUID();

        mockMvc.perform(post("/api/orgs/{orgId}/transfer", ORG_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", USER_ID)
                        .header("X-Org-Role", "ORG_OWNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newOwnerId\":\"" + newOwner + "\"}"))
                .andExpect(status().isNoContent());
    }

    // =========================================================================
    // DELETE /api/orgs/{orgId}
    // =========================================================================

    @Test
    void deleteOrg_validRequest_returns204() throws Exception {
        mockMvc.perform(delete("/api/orgs/{orgId}", ORG_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-Org-Role", "ORG_OWNER"))
                .andExpect(status().isNoContent());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private OrgResponse orgResponse() {
        return new OrgResponse(ORG_ID, "Acme Corp", "acme", null, null, null,
                OrgPlan.FREE, Map.of(), USER_ID, true, false, false,
                Instant.now(), Instant.now());
    }
}
