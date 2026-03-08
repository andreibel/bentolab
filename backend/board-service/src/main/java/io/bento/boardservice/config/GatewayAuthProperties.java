package io.bento.boardservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

// Reads `internal.gateway-secret` from application.yaml.
// This secret is shared between the API gateway and all microservices.
// Every request from the gateway carries X-Internal-Secret header with this value.
// If the header is missing or wrong, the request did not come from the gateway → reject.
@ConfigurationProperties(prefix = "internal")
public record GatewayAuthProperties(String gatewaySecret) {
}
