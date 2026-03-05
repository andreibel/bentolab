package io.bento.apigateway.filter;

import io.bento.apigateway.config.GatewayAuthProperty;
import io.bento.apigateway.config.GatewayProperties;
import io.bento.apigateway.service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter implements GlobalFilter, Ordered {

    private final JwtService jwtService;
    private final GatewayAuthProperty gatewayAuthProperty;
    private final GatewayProperties gatewayProperties;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        if (isPublicPath(path)) {
            return chain.filter(withInternalSecret(exchange));
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);

        try {
            Claims claims = jwtService.extractClaims(token);

            ServerWebExchange mutated = exchange.mutate()
                    .request(r -> {
                        r.header("X-Internal-Secret", gatewayAuthProperty.gatewaySecret());
                        r.header("X-User-Id", claims.getSubject());

                        String email = claims.get("email", String.class);
                        String orgId = claims.get("orgId", String.class);
                        String orgRole = claims.get("orgRole", String.class);
                        String orgSlug = claims.get("orgSlug", String.class);

                        if (email != null) r.header("X-User-Email", email);
                        if (orgId != null) r.header("X-Org-Id", orgId);
                        if (orgRole != null) r.header("X-Org-Role", orgRole);
                        if (orgSlug != null) r.header("X-Org-Slug", orgSlug);
                    })
                    .build();

            return chain.filter(mutated);

        } catch (JwtException e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    private boolean isPublicPath(String path) {
        return gatewayProperties.publicPaths().stream().anyMatch(path::equals);
    }

    private ServerWebExchange withInternalSecret(ServerWebExchange exchange) {
        return exchange.mutate()
                .request(r -> r.header("X-Internal-Secret", gatewayAuthProperty.gatewaySecret()))
                .build();
    }

    @Override
    public int getOrder() {
        return -1; // run before all other filters
    }
}