package io.bento.notificationservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "internal")
public record GatewayAuthProperties(String gatewaySecret) {}
