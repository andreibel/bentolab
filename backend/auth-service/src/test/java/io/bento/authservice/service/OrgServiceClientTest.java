package io.bento.authservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.bento.authservice.config.GatewayAuthProperties;
import io.bento.authservice.dto.response.UserOrgDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

/**
 * OrgServiceClient is tested by binding a MockRestServiceServer to a
 * RestClient.Builder before the RestClient is built.
 *
 * The Config inner class explicitly ensures MockRestServiceServer is created
 * (and bound to the builder) before OrgServiceClient builds from that builder,
 * eliminating any bean-ordering race.
 */
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = OrgServiceClientTest.Config.class)
@TestPropertySource(properties = {
        "services.org-service.url=http://org-service",
        "internal.gateway-secret=test-internal-secret"
})
class OrgServiceClientTest {

    @Autowired private OrgServiceClient orgServiceClient;
    @Autowired private MockRestServiceServer mockServer;

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID ORG_ID  = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void resetMockServer() {
        mockServer.reset();
    }

    // =========================================================================
    // getUserOrgs — happy path
    // =========================================================================

    @Test
    void getUserOrgs_successfulResponse_returnsDeserializedList() throws Exception {
        List<UserOrgDto> expected = List.of(
                new UserOrgDto(ORG_ID, "Acme", "acme", "OWNER", null));
        String json = objectMapper.writeValueAsString(expected);

        mockServer.expect(requestTo("http://org-service/api/internal/orgs/user/" + USER_ID))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));

        List<UserOrgDto> result = orgServiceClient.getUserOrgs(USER_ID);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().orgId()).isEqualTo(ORG_ID);
        assertThat(result.getFirst().orgName()).isEqualTo("Acme");
        assertThat(result.getFirst().orgSlug()).isEqualTo("acme");
        assertThat(result.getFirst().orgRole()).isEqualTo("OWNER");
        mockServer.verify();
    }

    @Test
    void getUserOrgs_sendsInternalSecretHeader() throws Exception {
        mockServer.expect(requestTo("http://org-service/api/internal/orgs/user/" + USER_ID))
                .andExpect(header("X-Internal-Secret", "test-internal-secret"))
                .andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));

        orgServiceClient.getUserOrgs(USER_ID);

        mockServer.verify();
    }

    @Test
    void getUserOrgs_sendsGetRequest() throws Exception {
        mockServer.expect(requestTo("http://org-service/api/internal/orgs/user/" + USER_ID))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));

        orgServiceClient.getUserOrgs(USER_ID);

        mockServer.verify();
    }

    @Test
    void getUserOrgs_userIdInPath() throws Exception {
        UUID specificId = UUID.fromString("aaaabbbb-cccc-dddd-eeee-ffffffffffff");
        mockServer.expect(requestTo("http://org-service/api/internal/orgs/user/" + specificId))
                .andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));

        orgServiceClient.getUserOrgs(specificId);

        mockServer.verify();
    }

    @Test
    void getUserOrgs_emptyArrayResponse_returnsEmptyList() throws Exception {
        mockServer.expect(requestTo("http://org-service/api/internal/orgs/user/" + USER_ID))
                .andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));

        assertThat(orgServiceClient.getUserOrgs(USER_ID)).isEmpty();
    }

    @Test
    void getUserOrgs_multipleOrgs_returnsAll() throws Exception {
        List<UserOrgDto> orgs = List.of(
                new UserOrgDto(UUID.randomUUID(), "Org A", "org-a", "OWNER", null),
                new UserOrgDto(UUID.randomUUID(), "Org B", "org-b", "MEMBER", "https://img.example.com/b.png"));
        String json = objectMapper.writeValueAsString(orgs);

        mockServer.expect(requestTo("http://org-service/api/internal/orgs/user/" + USER_ID))
                .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));

        List<UserOrgDto> result = orgServiceClient.getUserOrgs(USER_ID);

        assertThat(result).hasSize(2);
        assertThat(result).extracting(UserOrgDto::orgSlug).containsExactly("org-a", "org-b");
    }

    // =========================================================================
    // getUserOrgs — error handling (must return empty list, never throw)
    // =========================================================================

    @Test
    void getUserOrgs_serverReturns4xx_returnsEmptyList() {
        mockServer.expect(requestTo("http://org-service/api/internal/orgs/user/" + USER_ID))
                .andRespond(withBadRequest());

        assertThat(orgServiceClient.getUserOrgs(USER_ID)).isEmpty();
    }

    @Test
    void getUserOrgs_serverReturns5xx_returnsEmptyList() {
        mockServer.expect(requestTo("http://org-service/api/internal/orgs/user/" + USER_ID))
                .andRespond(withServerError());

        assertThat(orgServiceClient.getUserOrgs(USER_ID)).isEmpty();
    }

    // =========================================================================
    // Test configuration
    // =========================================================================

    @TestConfiguration
    @EnableConfigurationProperties(GatewayAuthProperties.class)
    @Import(OrgServiceClient.class)
    static class Config {

        @Bean
        RestClient.Builder restClientBuilder() {
            return RestClient.builder();
        }

        @Bean
        MockRestServiceServer mockServer(RestClient.Builder builder) {
            return MockRestServiceServer.bindTo(builder).build();
        }

        // Explicit dependency on mockServer ensures it is created (and bound to
        // the builder) before the RestClient is built here.
        @Bean("orgServiceRestClient")
        RestClient orgServiceRestClient(RestClient.Builder builder,
                                        GatewayAuthProperties props,
                                        MockRestServiceServer mockServer) {
            return builder
                    .baseUrl("http://org-service")
                    .defaultHeader("X-Internal-Secret", props.gatewaySecret())
                    .build();
        }
    }
}
