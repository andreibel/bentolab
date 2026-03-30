package io.bento.realtimeservice.config;

import io.bento.security.GatewayAuthProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final GatewayAuthProperties gatewayAuthProperties;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-memory broker — replace with Redis relay for multi-instance
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(new WebSocketHandshakeHandler())
                .addInterceptors(new WebSocketHandshakeInterceptor(gatewayAuthProperties));
    }
}
