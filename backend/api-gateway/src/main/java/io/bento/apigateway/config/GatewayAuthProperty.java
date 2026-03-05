package io.bento.apigateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("internal")
public record GatewayAuthProperty(
        String gatewaySecret
) {

}