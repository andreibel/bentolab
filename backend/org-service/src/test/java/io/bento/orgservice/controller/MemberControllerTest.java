package io.bento.orgservice.controller;

import io.bento.security.GatewayAuthProperties;
import io.bento.security.SecurityConfig;
import io.bento.orgservice.dto.response.MemberResponse;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.exception.OrgAccessDeniedException;
import io.bento.orgservice.exception.OrganizationMemberNotFoundException;
import io.bento.orgservice.service.MemberService;
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

@WebMvcTest(MemberController.class)
@Import(SecurityConfig.class)
class MemberControllerTest {

    private static final String SECRET    = "test-secret";
    private static final UUID   ORG_ID    = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID   ADMIN_ID  = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID   MEMBER_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");

    @Autowired private MockMvc mockMvc;
    @MockitoBean private MemberService memberService;

    @TestConfiguration
    @EnableConfigurationProperties(GatewayAuthProperties.class)
    static class TestConfig {}

    // =========================================================================
    // GET /api/orgs/{orgId}/members
    // =========================================================================

    @Test
    void getMembers_validRequest_returns200() throws Exception {
        when(memberService.getAllOrgMember(ORG_ID))
                .thenReturn(List.of(memberResponse(MEMBER_ID, OrgRoles.ORG_MEMBER)));

        mockMvc.perform(get("/api/orgs/{orgId}/members", ORG_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", ADMIN_ID)
                        .header("X-Org-Id", ORG_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(MEMBER_ID.toString()));
    }

    @Test
    void getMembers_noSecret_returns401() throws Exception {
        mockMvc.perform(get("/api/orgs/{orgId}/members", ORG_ID))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getMembers_emptyList_returns200() throws Exception {
        when(memberService.getAllOrgMember(ORG_ID)).thenReturn(List.of());

        mockMvc.perform(get("/api/orgs/{orgId}/members", ORG_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-Org-Id", ORG_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // =========================================================================
    // PATCH /api/orgs/{orgId}/members/{userId}/role
    // =========================================================================

    @Test
    void updateMembersRole_validRequest_returns200() throws Exception {
        when(memberService.updateMemberRole(any(), any(), any(), any(), any()))
                .thenReturn(memberResponse(MEMBER_ID, OrgRoles.ORG_ADMIN));

        mockMvc.perform(patch("/api/orgs/{orgId}/members/{userId}/role", ORG_ID, MEMBER_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", ADMIN_ID)
                        .header("X-Org-Role", "ORG_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"orgRole":"ORG_ADMIN"}"""))
                .andExpect(status().isOk());
    }

    @Test
    void updateMembersRole_missingOrgRoleInBody_returns400() throws Exception {
        // orgRole field is @NotNull — omitting it triggers validation failure → 400
        mockMvc.perform(patch("/api/orgs/{orgId}/members/{userId}/role", ORG_ID, MEMBER_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", ADMIN_ID)
                        .header("X-Org-Role", "ORG_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateMembersRole_serviceThrowsAccessDenied_returns403() throws Exception {
        when(memberService.updateMemberRole(any(), any(), any(), any(), any()))
                .thenThrow(new OrgAccessDeniedException("forbidden"));

        mockMvc.perform(patch("/api/orgs/{orgId}/members/{userId}/role", ORG_ID, MEMBER_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", ADMIN_ID)
                        .header("X-Org-Role", "ORG_MEMBER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"orgRole":"ORG_ADMIN"}"""))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateMembersRole_memberNotFound_returns404() throws Exception {
        when(memberService.updateMemberRole(any(), any(), any(), any(), any()))
                .thenThrow(new OrganizationMemberNotFoundException("not found"));

        mockMvc.perform(patch("/api/orgs/{orgId}/members/{userId}/role", ORG_ID, MEMBER_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", ADMIN_ID)
                        .header("X-Org-Role", "ORG_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"orgRole":"ORG_ADMIN"}"""))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // DELETE /api/orgs/{orgId}/members/{userId}
    // =========================================================================

    @Test
    void deleteMember_validRequest_returns204() throws Exception {
        mockMvc.perform(delete("/api/orgs/{orgId}/members/{userId}", ORG_ID, MEMBER_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", ADMIN_ID)
                        .header("X-Org-Role", "ORG_ADMIN"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteMember_serviceThrowsAccessDenied_returns403() throws Exception {
        doThrow(new OrgAccessDeniedException("forbidden"))
                .when(memberService).deleteMember(any(), any(), any(), any());

        mockMvc.perform(delete("/api/orgs/{orgId}/members/{userId}", ORG_ID, MEMBER_ID)
                        .header("X-Internal-Secret", SECRET)
                        .header("X-User-Id", ADMIN_ID)
                        .header("X-Org-Role", "ORG_MEMBER"))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private MemberResponse memberResponse(UUID userId, OrgRoles role) {
        return new MemberResponse(userId, role, null, Instant.now());
    }
}
