package io.bento.taskservice.client;

import io.bento.taskservice.config.GatewayAuthProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.List;

@Component
public class BoardServiceClient {

    private static final Logger log = LoggerFactory.getLogger(BoardServiceClient.class);

    private final RestClient restClient;
    private final GatewayAuthProperties gatewayAuthProperties;

    public BoardServiceClient(
            @Value("${services.board-service.url}") String boardServiceUrl,
            GatewayAuthProperties gatewayAuthProperties) {
        this.gatewayAuthProperties = gatewayAuthProperties;
        this.restClient = RestClient.builder()
                .baseUrl(boardServiceUrl)
                .build();
    }

    public List<String> getBoardMemberIds(String boardId) {
        try {
            List<String> memberIds = restClient.get()
                    .uri("/internal/boards/{boardId}/member-ids", boardId)
                    .header("X-Internal-Secret", gatewayAuthProperties.gatewaySecret())
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
            return memberIds != null ? memberIds : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Failed to fetch board member IDs for boardId={}: {}", boardId, e.getMessage());
            return Collections.emptyList();
        }
    }
}
