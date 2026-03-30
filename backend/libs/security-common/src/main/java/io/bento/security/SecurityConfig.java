package io.bento.security;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(GatewayAuthProperties.class)
public class SecurityConfig {

    @Bean
    @ConditionalOnMissingBean
    public GatewayAuthFilter gatewayAuthFilter(GatewayAuthProperties props) {
        return new GatewayAuthFilter(props);
    }

    @Bean
    @ConditionalOnMissingBean(SecurityFilterChain.class)
    public SecurityFilterChain securityFilterChain(HttpSecurity http, GatewayAuthFilter gatewayAuthFilter) throws Exception {
        return http
                // No CSRF needed — stateless API, no browser sessions
                .csrf(AbstractHttpConfigurer::disable)
                // No sessions — every request is self-contained via headers
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // permitAll at Spring Security level — the gateway already enforces which
                // endpoints require auth. GatewayAuthFilter rejects non-gateway requests,
                // and service code rejects missing/insufficient X-User-Id via exceptions.
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .addFilterBefore(gatewayAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
