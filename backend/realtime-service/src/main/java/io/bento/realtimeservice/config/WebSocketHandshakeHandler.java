package io.bento.realtimeservice.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

/**
 * Maps the userId stored by WebSocketHandshakeInterceptor to a STOMP Principal.
 * This makes convertAndSendToUser(userId, ...) route to the right session.
 */
public class WebSocketHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler,
                                      Map<String, Object> attributes) {
        String userId = (String) attributes.get("userId");
        return userId != null ? () -> userId : null;
    }
}
