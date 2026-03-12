package io.bento.authservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class OrgServiceClientConfig {

    @Bean("orgServiceRestClient")
    RestClient orgServiceRestClient(
            RestClient.Builder builder,
            GatewayAuthProperties props,
            @Value("${services.org-service.url}") String url) {
        return builder
                .baseUrl(url)
                .defaultHeader("X-Internal-Secret", props.gatewaySecret())
                .build();
    }
}
