package io.bento.orgservice.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(OrgNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleOrgNotFound(OrgNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(OrgAccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleOrgAccessDenied(OrgAccessDeniedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(SlugAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleSlugAlreadyExists(SlugAlreadyExistsException ex) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(MemberAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleMemberAlreadyExists(MemberAlreadyExistsException ex) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(OrganizationMemberNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleMemberNotFound(OrganizationMemberNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(InvitationNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleInvitationNotFound(InvitationNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(InvitationAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleInvitationAlreadyExists(InvitationAlreadyExistsException ex) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(InvitationExpiredException.class)
    public ResponseEntity<ErrorResponse> handleInvitationExpired(InvitationExpiredException ex) {
        return buildResponse(HttpStatus.GONE, ex.getMessage());
    }

    @ExceptionHandler(InvalidInvitationStatusException.class)
    public ResponseEntity<ErrorResponse> handleInvalidInvitationStatus(InvalidInvitationStatusException ex) {
        return buildResponse(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid value",
                        (first, second) -> first
                ));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(HttpStatus.BAD_REQUEST.value(), "Validation failed", fieldErrors, Instant.now()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
    }

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String message) {
        return ResponseEntity.status(status)
                .body(new ErrorResponse(status.value(), message, null, Instant.now()));
    }

    public record ErrorResponse(
            int status,
            String message,
            Map<String, String> errors,
            Instant timestamp
    ) {}
}
