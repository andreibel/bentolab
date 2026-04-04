package io.bento.authservice.controller;

import io.bento.authservice.dto.request.*;
import io.bento.authservice.dto.response.AuthResponse;
import io.bento.authservice.dto.response.TokenResponse;
import io.bento.authservice.service.AuthService;
import io.bento.authservice.service.EmailVerificationService;
import io.bento.authservice.service.PasswordResetService;
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
    private final EmailVerificationService emailVerificationService;
    private final PasswordResetService passwordResetService;

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

    /**
     * Switches org context using a refresh token instead of an access token.
     * Called when the user lands on a subdomain whose org slug differs from their stored context.
     * No JWT required — validated via refresh token.
     */
    @PostMapping("/switch-org-by-slug")
    public ResponseEntity<TokenResponse> switchOrgBySlug(@Valid @RequestBody SwitchOrgBySlugRequest request) {
        return ResponseEntity.ok(authService.switchOrgBySlug(request.refreshToken(), request.orgSlug()));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@RequestParam String token) {
        emailVerificationService.verify(token);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        emailVerificationService.resendVerification(request.email());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody PasswordResetRequest request) {
        passwordResetService.requestReset(request.email());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok().build();
    }
}
