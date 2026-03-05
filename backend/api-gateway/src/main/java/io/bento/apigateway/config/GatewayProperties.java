package io.bento.apigateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties("gateway")
public record GatewayProperties(
        List<String> publicPaths
) {

}