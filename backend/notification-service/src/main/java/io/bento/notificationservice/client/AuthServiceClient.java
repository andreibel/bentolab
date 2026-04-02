package io.bento.notificationservice.client;

import io.bento.notificationservice.dto.response.UserInfoDto;
import io.bento.security.GatewayAuthProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
public class AuthServiceClient {

    private final RestClient restClient;
    private final GatewayAuthProperties gatewayAuthProperties;

    public AuthServiceClient(
            @Value("${services.auth-service.url}") String authServiceUrl,
            GatewayAuthProperties gatewayAuthProperties) {
        this.gatewayAuthProperties = gatewayAuthProperties;
        this.restClient = RestClient.builder()
                .baseUrl(authServiceUrl)
                .build();
    }

    /**
     * Resolves a batch of user IDs to their email + firstName.
     * Returns a map keyed by userId (as String).
     * Missing or failed lookups are silently omitted.
     */
    public Map<String, UserInfoDto> batchGetUsers(List<String> userIds) {
        if (userIds == null || userIds.isEmpty()) return Collections.emptyMap();
        try {
            List<UUID> uuids = userIds.stream()
                    .filter(id -> id != null && !id.isBlank())
                    .map(UUID::fromString)
                    .toList();
            if (uuids.isEmpty()) return Collections.emptyMap();

            List<UserInfoDto> profiles = restClient.post()
                    .uri("/api/users/batch")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Internal-Secret", gatewayAuthProperties.gatewaySecret())
                    .body(uuids)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
            if (profiles == null) return Collections.emptyMap();
            return profiles.stream()
                    .filter(p -> p.id() != null)
                    .collect(Collectors.toMap(UserInfoDto::id, Function.identity()));
        } catch (Exception e) {
            log.warn("Failed to batch-resolve users {}: {}", userIds, e.getMessage());
            return Collections.emptyMap();
        }
    }
}
