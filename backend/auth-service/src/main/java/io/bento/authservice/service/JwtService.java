package io.bento.authservice.service;

import io.bento.authservice.config.JwtProperties;
import io.bento.authservice.dto.response.UserOrgDto;
import io.bento.authservice.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final JwtProperties jwtProperties;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.secretKey = Keys.hmacShaKeyFor(jwtProperties.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user, UserOrgDto org) {
        var builder = Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("systemRole", user.getSystemRole().name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtProperties.accessTokenExpiration()))
                .signWith(secretKey);

        if (org != null) {
            builder.claim("orgId", org.orgId().toString())
                    .claim("orgRole", org.orgRole())
                    .claim("orgSlug", org.orgSlug());
        }

        return builder.compact();
    }

}
