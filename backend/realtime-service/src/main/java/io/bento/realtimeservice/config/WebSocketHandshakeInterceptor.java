package io.bento.realtimeservice.config;

import io.bento.security.GatewayAuthProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Slf4j
@RequiredArgsConstructor
public class WebSocketHandshakeInterceptor implements HandshakeInterceptor {

    private final GatewayAuthProperties gatewayAuthProperties;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        // Step 1: verify the request came through the gateway via shared secret
        String incomingSecret = request.getHeaders().getFirst("X-Internal-Secret");
        if (!gatewayAuthProperties.gatewaySecret().equals(incomingSecret)) {
            log.warn("WebSocket handshake rejected: missing or invalid X-Internal-Secret");
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        // Step 2: store userId so the HandshakeHandler can build a Principal
        String userId = request.getHeaders().getFirst("X-User-Id");
        if (userId == null || userId.isBlank()) {
            log.warn("WebSocket handshake rejected: missing X-User-Id");
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }
        attributes.put("userId", userId);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }
}
