package io.bento.authservice.service;

import io.bento.security.GatewayAuthProperties;
import io.bento.authservice.dto.response.UserOrgDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrgServiceClient {

    private final GatewayAuthProperties gatewayAuthProperties;

    @Value("${services.org-service.url}")
    private String orgServiceUrl;

    public List<UserOrgDto> getUserOrgs(UUID userId) {
        try {
            return RestClient.builder()
                    .baseUrl(orgServiceUrl)
                    .build()
                    .get()
                    .uri("/api/internal/orgs/user/{userId}", userId)
                    .header("X-Internal-Secret", gatewayAuthProperties.gatewaySecret())
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
        } catch (RestClientException e) {
            log.error("Failed to fetch orgs for user {} from org-service: {} {}", userId, e.getClass().getSimpleName(), e.getMessage(), e);
            return List.of();
        }
    }
}
