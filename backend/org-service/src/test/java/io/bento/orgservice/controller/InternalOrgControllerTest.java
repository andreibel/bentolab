package io.bento.orgservice.controller;

import io.bento.security.GatewayAuthProperties;
import io.bento.security.SecurityConfig;
import io.bento.orgservice.entity.Organization;
import io.bento.orgservice.entity.OrganizationMember;
import io.bento.orgservice.enums.OrgRoles;
import io.bento.orgservice.repository.OrganizationMemberRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(InternalOrgController.class)
@Import(SecurityConfig.class)
class InternalOrgControllerTest {

    private static final String SECRET  = "test-secret";
    private static final UUID   USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID   ORG_ID  = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @Autowired private MockMvc mockMvc;
    @MockitoBean private OrganizationMemberRepository memberRepository;

    @TestConfiguration
    @EnableConfigurationProperties(GatewayAuthProperties.class)
    static class TestConfig {}

    // =========================================================================
    // GET /api/internal/orgs/user/{userId}
    // =========================================================================

    @Test
    void getUserOrgs_validRequest_returns200() throws Exception {
        when(memberRepository.findAllByUserIdWithOrg(USER_ID))
                .thenReturn(List.of(buildMember("Acme", "acme", OrgRoles.ORG_OWNER)));

        mockMvc.perform(get("/api/internal/orgs/user/{userId}", USER_ID)
                        .header("X-Internal-Secret", SECRET))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].orgSlug").value("acme"))
                .andExpect(jsonPath("$[0].orgName").value("Acme"))
                .andExpect(jsonPath("$[0].orgRole").value("ORG_OWNER"))
                .andExpect(jsonPath("$[0].orgId").value(ORG_ID.toString()));
    }

    @Test
    void getUserOrgs_noSecret_returns401() throws Exception {
        mockMvc.perform(get("/api/internal/orgs/user/{userId}", USER_ID))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getUserOrgs_emptyResult_returns200EmptyArray() throws Exception {
        when(memberRepository.findAllByUserIdWithOrg(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/internal/orgs/user/{userId}", USER_ID)
                        .header("X-Internal-Secret", SECRET))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void getUserOrgs_nullLogoUrl_returnsEmptyString() throws Exception {
        OrganizationMember member = buildMember("Acme", "acme", OrgRoles.ORG_MEMBER);
        member.getOrganization().setLogoUrl(null);
        when(memberRepository.findAllByUserIdWithOrg(USER_ID)).thenReturn(List.of(member));

        mockMvc.perform(get("/api/internal/orgs/user/{userId}", USER_ID)
                        .header("X-Internal-Secret", SECRET))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].logoUrl").value(""));
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private OrganizationMember buildMember(String name, String slug, OrgRoles role) {
        Organization org = Organization.builder()
                .id(ORG_ID).name(name).slug(slug).ownerId(USER_ID).logoUrl("https://logo.png").build();
        return OrganizationMember.builder()
                .organization(org).userId(USER_ID).orgRole(role).joinedAt(Instant.now()).build();
    }
}
