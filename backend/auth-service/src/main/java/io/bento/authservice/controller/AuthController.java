package io.bento.authservice.controller;

import io.bento.authservice.dto.request.LoginRequest;
import io.bento.authservice.dto.request.RefreshTokenRequest;
import io.bento.authservice.dto.request.RegisterRequest;
import io.bento.authservice.dto.request.SwitchOrgRequest;
import io.bento.authservice.dto.response.AuthResponse;
import io.bento.authservice.dto.response.TokenResponse;
import io.bento.authservice.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request.refreshToken(), request.currentOrgId()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/switch-org")
    public ResponseEntity<TokenResponse> switchOrg(@Valid @RequestBody SwitchOrgRequest request,
                                                    Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(authService.switchOrg(userId, request.orgId()));
    }
}
