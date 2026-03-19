package io.bento.notificationservice.client;

import io.bento.security.GatewayAuthProperties;
import io.bento.notificationservice.dto.response.SprintEndingSoonDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class TaskServiceClient {

    private final RestClient restClient;
    private final GatewayAuthProperties gatewayAuthProperties;

    public TaskServiceClient(
            @Value("${services.task-service.url}") String taskServiceUrl,
            GatewayAuthProperties gatewayAuthProperties) {
        this.gatewayAuthProperties = gatewayAuthProperties;
        this.restClient = RestClient.builder()
                .baseUrl(taskServiceUrl)
                .build();
    }

    public List<SprintEndingSoonDto> getSprintsEndingSoon(int withinHours) {
        try {
            List<SprintEndingSoonDto> result = restClient.get()
                    .uri("/internal/sprints/ending-soon?withinHours={h}", withinHours)
                    .header("X-Internal-Secret", gatewayAuthProperties.gatewaySecret())
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
            return result != null ? result : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Failed to fetch sprints ending soon: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
