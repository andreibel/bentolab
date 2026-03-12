package io.bento.authservice.service;

import io.bento.authservice.dto.response.UserOrgDto;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.UUID;

@Component
public class OrgServiceClient {

    private final RestClient restClient;

    public OrgServiceClient(@Qualifier("orgServiceRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public List<UserOrgDto> getUserOrgs(UUID userId) {
        try {
            return restClient.get()
                    .uri("/api/internal/orgs/user/{userId}", userId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<UserOrgDto>>() {});
        } catch (RestClientException e) {
            return List.of();
        }
    }
}
