package io.bento.notificationservice.security;

import io.bento.notificationservice.config.GatewayAuthProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class GatewayAuthFilter extends OncePerRequestFilter {

    private static final String SECRET_HEADER = "X-Internal-Secret";
    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String ORG_ROLE_HEADER = "X-Org-Role";

    private final GatewayAuthProperties gatewayAuthProperties;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String secret = request.getHeader(SECRET_HEADER);

        if (!gatewayAuthProperties.gatewaySecret().equals(secret)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        String userId = request.getHeader(USER_ID_HEADER);
        if (userId != null) {
            String orgRole = request.getHeader(ORG_ROLE_HEADER);
            List<SimpleGrantedAuthority> authorities = orgRole != null
                    ? List.of(new SimpleGrantedAuthority("ROLE_" + orgRole))
                    : List.of();

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(userId, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}
