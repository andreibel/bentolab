package io.bento.authservice.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password,
        String orgSlug   // optional — scopes JWT to a specific org on login (subdomain flow)
) {
    /** Backward-compatible constructor used by existing tests and callers. */
    public LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
        this(email, password, null);
    }
}
