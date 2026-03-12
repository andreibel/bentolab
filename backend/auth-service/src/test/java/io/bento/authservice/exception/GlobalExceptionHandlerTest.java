package io.bento.authservice.exception;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * GlobalExceptionHandler is tested as a plain object — no Spring context needed.
 * Each handler method is invoked directly and the ResponseEntity is inspected.
 */
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void emailAlreadyExists_returns409() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleEmailAlreadyExists(new EmailAlreadyExistsException("john@example.com"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(409);
        assertThat(response.getBody().message()).isEqualTo("Email already registered: john@example.com");
    }

    @Test
    void userNotFound_returns404() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleUserNotFound(new UserNotFoundException("Not found"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(404);
    }

    @Test
    void invalidToken_returns401() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleInvalidToken(new InvalidTokenException("Token expired"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(401);
        assertThat(response.getBody().message()).isEqualTo("Token expired");
    }

    @Test
    void badCredentials_returns401() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleBadCredentials(new BadCredentialsException("Bad creds"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(401);
    }

    @Test
    void genericException_returns500() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleGeneric(new RuntimeException("boom"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(500);
        assertThat(response.getBody().message()).isEqualTo("An unexpected error occurred");
    }

    @Test
    void errorResponse_timestampIsNotNull() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleGeneric(new RuntimeException("boom"));
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().timestamp()).isNotNull();
    }

    @Test
    void validation_returns400() {
        MethodArgumentNotValidException ex = buildValidationException("email", "must not be blank");

        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = handler.handleValidation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(400);
    }

    @Test
    void validation_includesFieldErrors() {
        MethodArgumentNotValidException ex = buildValidationException("email", "must not be blank");

        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = handler.handleValidation(ex);
        assertThat(response.getBody()).isNotNull();
        Map<String, String> errors = response.getBody().errors();
        assertThat(errors).containsEntry("email", "must not be blank");
    }

    @Test
    void validation_messageIsValidationFailed() {
        MethodArgumentNotValidException ex = buildValidationException("password", "too short");

        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = handler.handleValidation(ex);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo("Validation failed");
    }

    @Test
    void errorResponse_nullErrorsForSimpleExceptions() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleUserNotFound(new UserNotFoundException("not found"));
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errors()).isNull();
    }

    // =========================================================================
    // Helper
    // =========================================================================

    private MethodArgumentNotValidException buildValidationException(String field, String message) {
        MethodParameter param = Mockito.mock(MethodParameter.class);
        BindException bindingResult = new BindException(new Object(), "request");
        bindingResult.addError(new FieldError("request", field, message));
        return new MethodArgumentNotValidException(param, bindingResult);
    }
}
