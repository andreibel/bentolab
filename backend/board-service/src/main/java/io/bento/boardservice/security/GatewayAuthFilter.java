package io.bento.boardservice.security;

import io.bento.boardservice.config.GatewayAuthProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class GatewayAuthFilter extends OncePerRequestFilter {

    private final GatewayAuthProperties gatewayAuthProperties;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Step 1: verify the request came from the gateway via shared secret.
        // Requests hitting the service directly (bypassing the gateway) won't have this header.
        String incomingSecret = request.getHeader("X-Internal-Secret");
        if (!gatewayAuthProperties.gatewaySecret().equals(incomingSecret)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Direct service access not allowed\"}");
            return;
        }

        // Step 2: if the gateway forwarded X-User-Id, the JWT was valid → populate SecurityContext.
        // Public endpoints (login, register) won't have this header — SecurityContext stays anonymous.
        String userIdHeader = request.getHeader("X-User-Id");
        if (userIdHeader != null && !userIdHeader.isBlank()) {
            try {
                UUID userId = UUID.fromString(userIdHeader);
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(userId, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (IllegalArgumentException ignored) {
                // malformed X-User-Id — leave SecurityContext anonymous
            }
        }

        filterChain.doFilter(request, response);
    }
}
