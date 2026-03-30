package io.bento.orgservice.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    void handleOrgNotFound_returns404() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleOrgNotFound(new OrgNotFoundException("org not found"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(404);
        assertThat(response.getBody().message()).isEqualTo("org not found");
        assertThat(response.getBody().errors()).isNull();
        assertThat(response.getBody().timestamp()).isNotNull();
    }

    @Test
    void handleOrgAccessDenied_returns403() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleOrgAccessDenied(new OrgAccessDeniedException("access denied"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody().status()).isEqualTo(403);
        assertThat(response.getBody().message()).isEqualTo("access denied");
    }

    @Test
    void handleSlugAlreadyExists_returns409() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleSlugAlreadyExists(new SlugAlreadyExistsException("slug taken"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().status()).isEqualTo(409);
        assertThat(response.getBody().message()).isEqualTo("slug taken");
    }

    @Test
    void handleMemberAlreadyExists_returns409() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleMemberAlreadyExists(new MemberAlreadyExistsException("already member"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().status()).isEqualTo(409);
    }

    @Test
    void handleMemberNotFound_returns404() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleMemberNotFound(new OrganizationMemberNotFoundException("member not found"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().status()).isEqualTo(404);
        assertThat(response.getBody().message()).isEqualTo("member not found");
    }

    @Test
    void handleInvitationNotFound_returns404() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleInvitationNotFound(new InvitationNotFoundException("invitation gone"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().status()).isEqualTo(404);
    }

    @Test
    void handleInvitationAlreadyExists_returns409() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleInvitationAlreadyExists(new InvitationAlreadyExistsException("duplicate"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().status()).isEqualTo(409);
    }

    @Test
    void handleInvitationExpired_returns410() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleInvitationExpired(new InvitationExpiredException("expired"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.GONE);
        assertThat(response.getBody().status()).isEqualTo(410);
        assertThat(response.getBody().message()).isEqualTo("expired");
    }

    @Test
    void handleInvalidInvitationStatus_returns422() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleInvalidInvitationStatus(new InvalidInvitationStatusException("not pending"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThat(response.getBody().status()).isEqualTo(422);
    }

    @Test
    void handleGeneric_returns500() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleGeneric(new RuntimeException("unexpected"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().status()).isEqualTo(500);
        assertThat(response.getBody().message()).isEqualTo("An unexpected error occurred");
    }

    @Test
    void handleValidation_returns400WithFieldErrors() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("obj", "email", "must not be blank");

        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = handler.handleValidation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().status()).isEqualTo(400);
        assertThat(response.getBody().message()).isEqualTo("Validation failed");
        assertThat(response.getBody().errors()).containsEntry("email", "must not be blank");
    }

    @Test
    void handleValidation_multipleFieldErrors_firstWins() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError e1 = new FieldError("obj", "slug", "invalid pattern");
        FieldError e2 = new FieldError("obj", "slug", "too long");

        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(e1, e2));

        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = handler.handleValidation(ex);

        assertThat(response.getBody().errors()).containsKey("slug");
        assertThat(response.getBody().errors().get("slug")).isIn("invalid pattern", "too long");
    }

    @Test
    void errorResponse_timestampNotNull_forAllHandlers() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleOrgNotFound(new OrgNotFoundException("x"));

        assertThat(response.getBody().timestamp()).isNotNull();
    }
}
