package io.bento.orgservice.controller;

import io.bento.security.GatewayAuthProperties;
import io.bento.security.SecurityConfig;
import io.bento.orgservice.dto.response.AcceptInvitationResponse;
import io.bento.orgservice.dto.response.InvitationPreviewResponse;
import io.bento.orgservice.dto.response.InvitationResponse;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.enums.Status;
import io.bento.orgservice.exception.InvitationExpiredException;
import io.bento.orgservice.exception.InvitationNotFoundException;
import io.bento.orgservice.exception.InvalidInvitationStatusException;
import io.bento.orgservice.service.OrgInvitationService;
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
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(InvitationController.class)
@Import(SecurityConfig.class)
class InvitationControllerTest {

    private static final String SECRET   = "test-secret";
    private static final UUID   ORG_ID   = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID   ADMIN_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID   USER_ID  = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final String TOKEN    = "test-token-abc";

    @Autowired private MockMvc mockMvc;
    @MockitoBean private OrgInvitationService orgInvitationService;

    @TestConfiguration
    @EnableConfigurationProperties(GatewayAuthProperties.class)
    static class TestConfig {}

    // =========================================================================
    // POST /api/orgs/{orgId}/invitations
    // =========================================================================

    @Test
    void sendInvitation_validRequest_returns201() throws Exception {
        when(orgInvitationService.sendEmailInvitation(any(), any(), any(), any()))
                .thenReturn(invitationResponse());

        mockMvc.perform(post("/api/orgs/{orgId}/invitations", ORG_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", ADMIN_ID)
                        .header("X-Org-Role", "ORG_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"user@example.com","orgRole":"ORG_MEMBER"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value(TOKEN));
    }

    @Test
    void sendInvitation_invalidEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/orgs/{orgId}/invitations", ORG_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", ADMIN_ID)
                        .header("X-Org-Role", "ORG_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"not-an-email","orgRole":"ORG_MEMBER"}"""))
                .andExpect(status().isBadRequest());
    }

    @Test
    void sendInvitation_missingEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/orgs/{orgId}/invitations", ORG_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", ADMIN_ID)
                        .header("X-Org-Role", "ORG_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"orgRole":"ORG_MEMBER"}"""))
                .andExpect(status().isBadRequest());
    }

    @Test
    void sendInvitation_noSecret_returns401() throws Exception {
        mockMvc.perform(post("/api/orgs/{orgId}/invitations", ORG_ID)
                        .header("X-User-Id", ADMIN_ID)
                        .header("X-Org-Role", "ORG_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"user@example.com","orgRole":"ORG_MEMBER"}"""))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // POST /api/orgs/{orgId}/invite-link
    // =========================================================================

    @Test
    void generateInviteLink_validRequest_returns201() throws Exception {
        when(orgInvitationService.generateOpenInviteLink(any(), any(), any(), any()))
                .thenReturn(invitationResponse());

        mockMvc.perform(post("/api/orgs/{orgId}/invite-link", ORG_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", ADMIN_ID)
                        .header("X-Org-Role", "ORG_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"orgRole":"ORG_MEMBER"}"""))
                .andExpect(status().isCreated());
    }

    @Test
    void generateInviteLink_missingOrgRole_returns400() throws Exception {
        mockMvc.perform(post("/api/orgs/{orgId}/invite-link", ORG_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", ADMIN_ID)
                        .header("X-Org-Role", "ORG_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // GET /api/orgs/{orgId}/invitations
    // =========================================================================

    @Test
    void getInvitations_noStatus_returns200() throws Exception {
        when(orgInvitationService.getAllOrgInvitations(any(), any(), isNull()))
                .thenReturn(List.of(invitationResponse()));

        mockMvc.perform(get("/api/orgs/{orgId}/invitations", ORG_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-Org-Role", "ORG_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].token").value(TOKEN));
    }

    @Test
    void getInvitations_withStatusParam_returns200() throws Exception {
        when(orgInvitationService.getAllOrgInvitations(any(), any(), eq(Status.PENDING)))
                .thenReturn(List.of(invitationResponse()));

        mockMvc.perform(get("/api/orgs/{orgId}/invitations", ORG_ID)
                        .param("status", "PENDING")
                        .header("X-Internal-Secret", SECRET)
                        .header("X-Org-Role", "ORG_ADMIN"))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // DELETE /api/orgs/{orgId}/invitations/{invitationId}
    // =========================================================================

    @Test
    void deleteInvitation_validRequest_returns204() throws Exception {
        UUID invId = UUID.randomUUID();

        mockMvc.perform(delete("/api/orgs/{orgId}/invitations/{invitationId}", ORG_ID, invId)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-Org-Role", "ORG_ADMIN"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteInvitation_serviceThrowsNotFound_returns404() throws Exception {
        UUID invId = UUID.randomUUID();
        doThrow(new InvitationNotFoundException("not found"))
                .when(orgInvitationService).deleteInvitation(any(), any(), any());

        mockMvc.perform(delete("/api/orgs/{orgId}/invitations/{invitationId}", ORG_ID, invId)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-Org-Role", "ORG_ADMIN"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteInvitation_serviceThrowsInvalidStatus_returns422() throws Exception {
        UUID invId = UUID.randomUUID();
        doThrow(new InvalidInvitationStatusException("not pending"))
                .when(orgInvitationService).deleteInvitation(any(), any(), any());

        mockMvc.perform(delete("/api/orgs/{orgId}/invitations/{invitationId}", ORG_ID, invId)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-Org-Role", "ORG_ADMIN"))
                .andExpect(status().isUnprocessableEntity());
    }

    // =========================================================================
    // GET /api/invitations/{token}/preview
    // =========================================================================

    @Test
    void previewInvitation_validToken_returns200() throws Exception {
        when(orgInvitationService.getInvitationPreview(TOKEN)).thenReturn(previewResponse());

        mockMvc.perform(get("/api/invitations/{token}/preview", TOKEN)
                        .header("X-Internal-Secret", SECRET))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orgSlug").value("acme"));
    }

    @Test
    void previewInvitation_tokenNotFound_returns404() throws Exception {
        when(orgInvitationService.getInvitationPreview(any()))
                .thenThrow(new InvitationNotFoundException("not found"));

        mockMvc.perform(get("/api/invitations/{token}/preview", "ghost-token")
                        .header("X-Internal-Secret", SECRET))
                .andExpect(status().isNotFound());
    }

    @Test
    void previewInvitation_expired_returns410() throws Exception {
        when(orgInvitationService.getInvitationPreview(any()))
                .thenThrow(new InvitationExpiredException("expired"));

        mockMvc.perform(get("/api/invitations/{token}/preview", TOKEN)
                        .header("X-Internal-Secret", SECRET))
                .andExpect(status().isGone());
    }

    // =========================================================================
    // POST /api/invitations/{token}/accept
    // =========================================================================

    @Test
    void acceptInvitation_validRequest_returns200() throws Exception {
        when(orgInvitationService.acceptInvitation(any(), any(), any()))
                .thenReturn(acceptResponse());

        mockMvc.perform(post("/api/invitations/{token}/accept", TOKEN)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", USER_ID)
                        .header("X-User-Email", "user@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orgSlug").value("acme"));
    }

    @Test
    void acceptInvitation_emailMismatch_returns404() throws Exception {
        when(orgInvitationService.acceptInvitation(any(), any(), any()))
                .thenThrow(new InvitationNotFoundException("mismatch"));

        mockMvc.perform(post("/api/invitations/{token}/accept", TOKEN)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", USER_ID)
                        .header("X-User-Email", "wrong@example.com"))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private InvitationResponse invitationResponse() {
        return new InvitationResponse(UUID.randomUUID(), "user@example.com",
                OrgRoles.ORG_MEMBER, Status.PENDING, ADMIN_ID,
                Instant.now().plusSeconds(86400), Instant.now(), TOKEN);
    }

    private InvitationPreviewResponse previewResponse() {
        return new InvitationPreviewResponse(ORG_ID, "Acme Corp", "acme",
                OrgRoles.ORG_MEMBER, true, Instant.now().plusSeconds(86400));
    }

    private AcceptInvitationResponse acceptResponse() {
        return new AcceptInvitationResponse(USER_ID, OrgRoles.ORG_MEMBER,
                Instant.now(), ORG_ID, "acme", "Acme Corp");
    }
}
