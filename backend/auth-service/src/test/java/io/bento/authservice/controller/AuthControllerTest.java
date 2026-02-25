package io.bento.authservice.controller;

import tools.jackson.databind.ObjectMapper;
import io.bento.authservice.config.SecurityConfig;
import io.bento.authservice.dto.request.LoginRequest;
import io.bento.authservice.dto.request.RefreshTokenRequest;
import io.bento.authservice.dto.request.RegisterRequest;
import io.bento.authservice.dto.request.SwitchOrgRequest;
import io.bento.authservice.dto.response.AuthResponse;
import io.bento.authservice.dto.response.TokenResponse;
import io.bento.authservice.dto.response.UserDto;
import io.bento.authservice.enums.SystemRole;
import io.bento.authservice.exception.EmailAlreadyExistsException;
import io.bento.authservice.exception.InvalidTokenException;
import io.bento.authservice.exception.UserNotFoundException;
import io.bento.authservice.security.JwtAuthEntryPoint;
import io.bento.authservice.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthEntryPoint.class})
@TestPropertySource(properties = {
        "jwt.secret=afvaydI6w3vgSzdYvXHf2kLsQxhpq9St91RBGLevr5Y=",
        "jwt.access-token-expiration=900000",
        "jwt.refresh-token-expiration=604800000",
        "auth.pepper=test-pepper"
})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    // ── URLs ─────────────────────────────────────────────────────────────────
    private static final String REGISTER_URL = "/api/auth/register";
    private static final String LOGIN_URL    = "/api/auth/login";
    private static final String REFRESH_URL  = "/api/auth/refresh";
    private static final String LOGOUT_URL   = "/api/auth/logout";
    private static final String SWITCH_URL   = "/api/auth/switch-org";

    // ── Valid user data ───────────────────────────────────────────────────────
    private static final String VALID_EMAIL      = "user@example.com";
    private static final String VALID_PASSWORD   = "password123";
    private static final String VALID_FIRST_NAME = "John";
    private static final String VALID_LAST_NAME  = "Doe";

    // ── Invalid email formats ─────────────────────────────────────────────────
    private static final String BLANK_EMAIL              = "   ";
    private static final String EMAIL_NO_AT_SIGN         = "userdomain.com";
    private static final String EMAIL_NO_DOMAIN          = "user@";
    private static final String EMAIL_INVALID_FORMAT     = "not-an-email";
    private static final String UNKNOWN_EMAIL            = "nobody@example.com";

    // ── Invalid passwords ─────────────────────────────────────────────────────
    private static final String BLANK_PASSWORD       = "   ";
    private static final String PASSWORD_TOO_SHORT   = "pass";
    private static final String PASSWORD_7_CHARS     = "pass123";   // boundary: 1 below minimum
    private static final String PASSWORD_8_CHARS     = "pass1234";  // boundary: exact minimum
    private static final String PASSWORD_TOO_LONG    = "a".repeat(101);

    // ── Invalid name values ───────────────────────────────────────────────────
    private static final String BLANK_NAME    = "";
    private static final String NAME_TOO_LONG = "a".repeat(101);

    // ── Token values ──────────────────────────────────────────────────────────
    private static final String VALID_REFRESH_TOKEN   = "valid-refresh-token";
    private static final String EXPIRED_REFRESH_TOKEN = "expired-refresh-token";
    private static final String REVOKED_REFRESH_TOKEN = "revoked-refresh-token";
    private static final String UNKNOWN_REFRESH_TOKEN = "unknown-refresh-token";
    private static final String BLANK_TOKEN           = "   ";

    // ── Mocked response values ────────────────────────────────────────────────
    private static final String MOCK_ACCESS_TOKEN  = "access-token";
    private static final String MOCK_REFRESH_TOKEN = "refresh-token";
    private static final String NEW_ACCESS_TOKEN   = "new-access-token";
    private static final String MOCK_USER_EMAIL    = "test@example.com";

    // ── Error messages ────────────────────────────────────────────────────────
    private static final String MSG_INVALID_CREDENTIALS = "Invalid email or password";
    private static final String MSG_ACCOUNT_DEACTIVATED = "Account is deactivated";
    private static final String MSG_TOKEN_EXPIRED        = "Refresh token has expired";
    private static final String MSG_TOKEN_REVOKED        = "Refresh token has been revoked";
    private static final String MSG_TOKEN_NOT_FOUND      = "Refresh token not found";

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AuthResponse mockAuthResponse() {
        UserDto user = new UserDto(
                UUID.randomUUID(), MOCK_USER_EMAIL, VALID_FIRST_NAME, VALID_LAST_NAME,
                null, SystemRole.USER, false, null, null, Instant.now()
        );
        return new AuthResponse(MOCK_ACCESS_TOKEN, MOCK_REFRESH_TOKEN, user, List.of());
    }

    private RegisterRequest validRegisterRequest() {
        return new RegisterRequest(VALID_EMAIL, VALID_PASSWORD, VALID_FIRST_NAME, VALID_LAST_NAME);
    }

    private LoginRequest validLoginRequest() {
        return new LoginRequest(VALID_EMAIL, VALID_PASSWORD);
    }

    // =========================================================================
    // POST /api/auth/register
    // =========================================================================

    /**
     * Register succeeds when all fields are valid.
     *
     * <p>Arrange: AuthService.register() is stubbed to return a valid AuthResponse.
     * <p>Act:     POST /api/auth/register with a fully valid body.
     * <p>Assert:  201 Created; accessToken, refreshToken, and user.email present in response.
     */
    @Test
    void register_validRequest_returns201() throws Exception {
        when(authService.register(any())).thenReturn(mockAuthResponse());

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRegisterRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").value(MOCK_ACCESS_TOKEN))
                .andExpect(jsonPath("$.refreshToken").value(MOCK_REFRESH_TOKEN))
                .andExpect(jsonPath("$.user.email").value(MOCK_USER_EMAIL));
    }

    /**
     * Register fails when the email is already taken.
     *
     * <p>Arrange: AuthService.register() throws EmailAlreadyExistsException.
     * <p>Act:     POST /api/auth/register with an email that already exists in the DB.
     * <p>Assert:  409 Conflict; response body contains the error message with the duplicate email.
     */
    @Test
    void register_duplicateEmail_returns409() throws Exception {
        when(authService.register(any()))
                .thenThrow(new EmailAlreadyExistsException(VALID_EMAIL));

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRegisterRequest())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email already registered: " + VALID_EMAIL));
    }

    /**
     * Register fails when the request body is an empty JSON object.
     *
     * <p>Arrange: No stub needed; validation fires before the service is called.
     * <p>Act:     POST /api/auth/register with body "{}".
     * <p>Assert:  400 Bad Request.
     */
    @Test
    void register_emptyBody_returns400() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // --- email field ---------------------------------------------------------

    /**
     * Register fails when the email field is omitted entirely.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/register without the email key.
     * <p>Assert:  400 Bad Request; validation error on the "email" field.
     */
    @Test
    void register_missingEmail_returns400() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"" + VALID_PASSWORD + "\",\"firstName\":\"" + VALID_FIRST_NAME + "\",\"lastName\":\"" + VALID_LAST_NAME + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists());
    }

    /**
     * Register fails when the email field is blank (whitespace only).
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/register with email = "   ".
     * <p>Assert:  400 Bad Request; validation error on the "email" field.
     */
    @Test
    void register_blankEmail_returns400() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest(BLANK_EMAIL, VALID_PASSWORD, VALID_FIRST_NAME, VALID_LAST_NAME))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists());
    }

    /**
     * Register fails when the email has a completely invalid format.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/register with email = "not-an-email".
     * <p>Assert:  400 Bad Request; validation error on the "email" field.
     */
    @Test
    void register_invalidEmailFormat_returns400() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest(EMAIL_INVALID_FORMAT, VALID_PASSWORD, VALID_FIRST_NAME, VALID_LAST_NAME))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists());
    }

    /**
     * Register fails when the email is missing the @ sign.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/register with email = "userdomain.com".
     * <p>Assert:  400 Bad Request; validation error on the "email" field.
     */
    @Test
    void register_emailMissingAtSign_returns400() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest(EMAIL_NO_AT_SIGN, VALID_PASSWORD, VALID_FIRST_NAME, VALID_LAST_NAME))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists());
    }

    /**
     * Register fails when the email has no domain after the @ sign.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/register with email = "user@".
     * <p>Assert:  400 Bad Request; validation error on the "email" field.
     */
    @Test
    void register_emailMissingDomain_returns400() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest(EMAIL_NO_DOMAIN, VALID_PASSWORD, VALID_FIRST_NAME, VALID_LAST_NAME))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists());
    }

    // --- password field ------------------------------------------------------

    /**
     * Register fails when the password field is omitted entirely.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/register without the password key.
     * <p>Assert:  400 Bad Request; validation error on the "password" field.
     */
    @Test
    void register_missingPassword_returns400() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + VALID_EMAIL + "\",\"firstName\":\"" + VALID_FIRST_NAME + "\",\"lastName\":\"" + VALID_LAST_NAME + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    /**
     * Register fails when the password field is blank (whitespace only).
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/register with password = "   ".
     * <p>Assert:  400 Bad Request; validation error on the "password" field.
     */
    @Test
    void register_blankPassword_returns400() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest(VALID_EMAIL, BLANK_PASSWORD, VALID_FIRST_NAME, VALID_LAST_NAME))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    /**
     * Register fails when the password is well below the 8-character minimum.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/register with password = "pass" (4 chars).
     * <p>Assert:  400 Bad Request; validation error on the "password" field.
     */
    @Test
    void register_passwordTooShort_returns400() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest(VALID_EMAIL, PASSWORD_TOO_SHORT, VALID_FIRST_NAME, VALID_LAST_NAME))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    /**
     * Register fails at the exact boundary — 7 characters is still too short.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/register with password = "pass123" (7 chars).
     * <p>Assert:  400 Bad Request; validation error on the "password" field.
     */
    @Test
    void register_passwordExactly7Chars_returns400() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest(VALID_EMAIL, PASSWORD_7_CHARS, VALID_FIRST_NAME, VALID_LAST_NAME))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    /**
     * Register succeeds at the exact minimum boundary — 8 characters is valid.
     *
     * <p>Arrange: AuthService.register() is stubbed to return a valid AuthResponse.
     * <p>Act:     POST /api/auth/register with password = "pass1234" (8 chars).
     * <p>Assert:  201 Created.
     */
    @Test
    void register_passwordExactly8Chars_returns201() throws Exception {
        when(authService.register(any())).thenReturn(mockAuthResponse());

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest(VALID_EMAIL, PASSWORD_8_CHARS, VALID_FIRST_NAME, VALID_LAST_NAME))))
                .andExpect(status().isCreated());
    }

    /**
     * Register fails when the password exceeds the 100-character maximum.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/register with password = 101 characters.
     * <p>Assert:  400 Bad Request; validation error on the "password" field.
     */
    @Test
    void register_passwordTooLong_returns400() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest(VALID_EMAIL, PASSWORD_TOO_LONG, VALID_FIRST_NAME, VALID_LAST_NAME))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    // --- firstName field -----------------------------------------------------

    /**
     * Register fails when the firstName field is omitted entirely.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/register without the firstName key.
     * <p>Assert:  400 Bad Request; validation error on the "firstName" field.
     */
    @Test
    void register_missingFirstName_returns400() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + VALID_EMAIL + "\",\"password\":\"" + VALID_PASSWORD + "\",\"lastName\":\"" + VALID_LAST_NAME + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.firstName").exists());
    }

    /**
     * Register fails when the firstName field is an empty string.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/register with firstName = "".
     * <p>Assert:  400 Bad Request; validation error on the "firstName" field.
     */
    @Test
    void register_blankFirstName_returns400() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest(VALID_EMAIL, VALID_PASSWORD, BLANK_NAME, VALID_LAST_NAME))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.firstName").exists());
    }

    /**
     * Register fails when firstName exceeds the 100-character maximum.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/register with firstName = 101 characters.
     * <p>Assert:  400 Bad Request; validation error on the "firstName" field.
     */
    @Test
    void register_firstNameTooLong_returns400() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest(VALID_EMAIL, VALID_PASSWORD, NAME_TOO_LONG, VALID_LAST_NAME))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.firstName").exists());
    }

    // --- lastName field ------------------------------------------------------

    /**
     * Register fails when the lastName field is omitted entirely.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/register without the lastName key.
     * <p>Assert:  400 Bad Request; validation error on the "lastName" field.
     */
    @Test
    void register_missingLastName_returns400() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + VALID_EMAIL + "\",\"password\":\"" + VALID_PASSWORD + "\",\"firstName\":\"" + VALID_FIRST_NAME + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.lastName").exists());
    }

    /**
     * Register fails when the lastName field is blank (whitespace only).
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/register with lastName = "   ".
     * <p>Assert:  400 Bad Request; validation error on the "lastName" field.
     */
    @Test
    void register_blankLastName_returns400() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest(VALID_EMAIL, VALID_PASSWORD, VALID_FIRST_NAME, "   "))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.lastName").exists());
    }

    /**
     * Register fails when lastName exceeds the 100-character maximum.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/register with lastName = 101 characters.
     * <p>Assert:  400 Bad Request; validation error on the "lastName" field.
     */
    @Test
    void register_lastNameTooLong_returns400() throws Exception {
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest(VALID_EMAIL, VALID_PASSWORD, VALID_FIRST_NAME, NAME_TOO_LONG))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.lastName").exists());
    }

    // =========================================================================
    // POST /api/auth/login
    // =========================================================================

    /**
     * Login succeeds with valid credentials.
     *
     * <p>Arrange: AuthService.login() is stubbed to return a valid AuthResponse.
     * <p>Act:     POST /api/auth/login with correct email and password.
     * <p>Assert:  200 OK; accessToken, refreshToken, and user object present in response.
     */
    @Test
    void login_validCredentials_returns200() throws Exception {
        when(authService.login(any())).thenReturn(mockAuthResponse());

        mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validLoginRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value(MOCK_ACCESS_TOKEN))
                .andExpect(jsonPath("$.refreshToken").value(MOCK_REFRESH_TOKEN))
                .andExpect(jsonPath("$.user").exists());
    }

    /**
     * Login fails when the password does not match the stored hash.
     *
     * <p>Arrange: AuthService.login() throws BadCredentialsException with a generic message
     *             (same message used for wrong password and unknown email — intentional
     *              to avoid user enumeration).
     * <p>Act:     POST /api/auth/login with correct email but wrong password.
     * <p>Assert:  401 Unauthorized; response contains the error message.
     */
    @Test
    void login_wrongPassword_returns401() throws Exception {
        when(authService.login(any()))
                .thenThrow(new BadCredentialsException(MSG_INVALID_CREDENTIALS));

        mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest(VALID_EMAIL, "wrongpass"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(MSG_INVALID_CREDENTIALS));
    }

    /**
     * Login fails when no user exists with the given email.
     * Returns the same 401 as wrong password to prevent user enumeration.
     *
     * <p>Arrange: AuthService.login() throws BadCredentialsException.
     * <p>Act:     POST /api/auth/login with an email that is not registered.
     * <p>Assert:  401 Unauthorized.
     */
    @Test
    void login_unknownEmail_returns401() throws Exception {
        when(authService.login(any()))
                .thenThrow(new BadCredentialsException(MSG_INVALID_CREDENTIALS));

        mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest(UNKNOWN_EMAIL, VALID_PASSWORD))))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Login fails when the account has been deactivated.
     *
     * <p>Arrange: AuthService.login() throws BadCredentialsException with deactivation message.
     * <p>Act:     POST /api/auth/login with credentials of a deactivated account.
     * <p>Assert:  401 Unauthorized; response contains the deactivation message.
     */
    @Test
    void login_deactivatedAccount_returns401() throws Exception {
        when(authService.login(any()))
                .thenThrow(new BadCredentialsException(MSG_ACCOUNT_DEACTIVATED));

        mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validLoginRequest())))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(MSG_ACCOUNT_DEACTIVATED));
    }

    /**
     * Login fails when the email field is omitted.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/login without the email key.
     * <p>Assert:  400 Bad Request; validation error on the "email" field.
     */
    @Test
    void login_missingEmail_returns400() throws Exception {
        mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"" + VALID_PASSWORD + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists());
    }

    /**
     * Login fails when the email has an invalid format.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/login with email = "not-an-email".
     * <p>Assert:  400 Bad Request; validation error on the "email" field.
     */
    @Test
    void login_invalidEmailFormat_returns400() throws Exception {
        mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest(EMAIL_INVALID_FORMAT, VALID_PASSWORD))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists());
    }

    /**
     * Login fails when the password field is omitted.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/login without the password key.
     * <p>Assert:  400 Bad Request; validation error on the "password" field.
     */
    @Test
    void login_missingPassword_returns400() throws Exception {
        mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + VALID_EMAIL + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    /**
     * Login fails when the password field is an empty string.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/login with password = "".
     * <p>Assert:  400 Bad Request; validation error on the "password" field.
     */
    @Test
    void login_blankPassword_returns400() throws Exception {
        mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest(VALID_EMAIL, BLANK_NAME))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    /**
     * Login fails when the request body is an empty JSON object.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/login with body "{}".
     * <p>Assert:  400 Bad Request.
     */
    @Test
    void login_emptyBody_returns400() throws Exception {
        mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // POST /api/auth/refresh
    // =========================================================================

    /**
     * Refresh succeeds when a valid, non-expired, non-revoked token is provided.
     *
     * <p>Arrange: AuthService.refresh() is stubbed to return a new TokenResponse.
     * <p>Act:     POST /api/auth/refresh with a valid refreshToken value.
     * <p>Assert:  200 OK; new accessToken and the same refreshToken returned.
     */
    @Test
    void refresh_validToken_returns200() throws Exception {
        when(authService.refresh(VALID_REFRESH_TOKEN))
                .thenReturn(new TokenResponse(NEW_ACCESS_TOKEN, VALID_REFRESH_TOKEN));

        mockMvc.perform(post(REFRESH_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RefreshTokenRequest(VALID_REFRESH_TOKEN))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value(NEW_ACCESS_TOKEN))
                .andExpect(jsonPath("$.refreshToken").value(VALID_REFRESH_TOKEN));
    }

    /**
     * Refresh fails when the token has passed its expiry date.
     *
     * <p>Arrange: AuthService.refresh() throws InvalidTokenException with "expired" message.
     * <p>Act:     POST /api/auth/refresh with an expired refreshToken.
     * <p>Assert:  401 Unauthorized; response contains the expiry error message.
     */
    @Test
    void refresh_expiredToken_returns401() throws Exception {
        when(authService.refresh(any()))
                .thenThrow(new InvalidTokenException(MSG_TOKEN_EXPIRED));

        mockMvc.perform(post(REFRESH_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RefreshTokenRequest(EXPIRED_REFRESH_TOKEN))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(MSG_TOKEN_EXPIRED));
    }

    /**
     * Refresh fails when the token has been explicitly revoked (e.g. after logout).
     *
     * <p>Arrange: AuthService.refresh() throws InvalidTokenException with "revoked" message.
     * <p>Act:     POST /api/auth/refresh with a revoked refreshToken.
     * <p>Assert:  401 Unauthorized; response contains the revocation error message.
     */
    @Test
    void refresh_revokedToken_returns401() throws Exception {
        when(authService.refresh(any()))
                .thenThrow(new InvalidTokenException(MSG_TOKEN_REVOKED));

        mockMvc.perform(post(REFRESH_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RefreshTokenRequest(REVOKED_REFRESH_TOKEN))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(MSG_TOKEN_REVOKED));
    }

    /**
     * Refresh fails when the token does not exist in the database.
     *
     * <p>Arrange: AuthService.refresh() throws InvalidTokenException with "not found" message.
     * <p>Act:     POST /api/auth/refresh with an unknown refreshToken.
     * <p>Assert:  401 Unauthorized.
     */
    @Test
    void refresh_tokenNotFound_returns401() throws Exception {
        when(authService.refresh(any()))
                .thenThrow(new InvalidTokenException(MSG_TOKEN_NOT_FOUND));

        mockMvc.perform(post(REFRESH_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RefreshTokenRequest(UNKNOWN_REFRESH_TOKEN))))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Refresh fails when the refreshToken field is omitted from the body.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/refresh with body "{}".
     * <p>Assert:  400 Bad Request; validation error on the "refreshToken" field.
     */
    @Test
    void refresh_missingToken_returns400() throws Exception {
        mockMvc.perform(post(REFRESH_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.refreshToken").exists());
    }

    /**
     * Refresh fails when the refreshToken field is an empty string.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/refresh with refreshToken = "".
     * <p>Assert:  400 Bad Request; validation error on the "refreshToken" field.
     */
    @Test
    void refresh_blankToken_returns400() throws Exception {
        mockMvc.perform(post(REFRESH_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RefreshTokenRequest(BLANK_NAME))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.refreshToken").exists());
    }

    /**
     * Refresh fails when the refreshToken field contains only whitespace.
     *
     * <p>Arrange: No stub needed.
     * <p>Act:     POST /api/auth/refresh with refreshToken = "   ".
     * <p>Assert:  400 Bad Request; validation error on the "refreshToken" field.
     */
    @Test
    void refresh_whitespaceToken_returns400() throws Exception {
        mockMvc.perform(post(REFRESH_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RefreshTokenRequest(BLANK_TOKEN))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.refreshToken").exists());
    }

    // =========================================================================
    // POST /api/auth/logout
    // =========================================================================

    /**
     * Logout succeeds when an authenticated user provides a valid refresh token.
     *
     * <p>Arrange: AuthService.logout() is stubbed as a no-op. X-User-Id header is present.
     * <p>Act:     POST /api/auth/logout with a valid refreshToken and auth header.
     * <p>Assert:  204 No Content.
     */
    @Test
    void logout_validToken_returns204() throws Exception {
        doNothing().when(authService).logout(any());

        mockMvc.perform(post(LOGOUT_URL)
                        .header("X-User-Id", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RefreshTokenRequest(VALID_REFRESH_TOKEN))))
                .andExpect(status().isNoContent());
    }

    /**
     * Logout fails when the refresh token does not exist in the database.
     *
     * <p>Arrange: AuthService.logout() throws InvalidTokenException. X-User-Id header is present.
     * <p>Act:     POST /api/auth/logout with an unknown refreshToken.
     * <p>Assert:  401 Unauthorized; response contains the "not found" message.
     */
    @Test
    void logout_tokenNotFound_returns401() throws Exception {
        doThrow(new InvalidTokenException(MSG_TOKEN_NOT_FOUND))
                .when(authService).logout(any());

        mockMvc.perform(post(LOGOUT_URL)
                        .header("X-User-Id", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RefreshTokenRequest(UNKNOWN_REFRESH_TOKEN))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(MSG_TOKEN_NOT_FOUND));
    }

    /**
     * Logout fails when the refreshToken field is missing from the body.
     * The endpoint is protected, so the X-User-Id header is still required.
     *
     * <p>Arrange: No stub needed. X-User-Id header is present.
     * <p>Act:     POST /api/auth/logout with body "{}".
     * <p>Assert:  400 Bad Request; validation error on the "refreshToken" field.
     */
    @Test
    void logout_missingToken_returns400() throws Exception {
        mockMvc.perform(post(LOGOUT_URL)
                        .header("X-User-Id", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.refreshToken").exists());
    }

    /**
     * Logout fails when the refreshToken field is blank (whitespace only).
     * The endpoint is protected, so the X-User-Id header is still required.
     *
     * <p>Arrange: No stub needed. X-User-Id header is present.
     * <p>Act:     POST /api/auth/logout with refreshToken = "   ".
     * <p>Assert:  400 Bad Request; validation error on the "refreshToken" field.
     */
    @Test
    void logout_blankToken_returns400() throws Exception {
        mockMvc.perform(post(LOGOUT_URL)
                        .header("X-User-Id", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RefreshTokenRequest(BLANK_TOKEN))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.refreshToken").exists());
    }

    // =========================================================================
    // POST /api/auth/switch-org
    // =========================================================================

    /**
     * Switch org succeeds when the user is authenticated and provides a valid orgId.
     *
     * <p>Arrange: AuthService.switchOrg() is stubbed to return a new TokenResponse.
     *             X-User-Id header is set to a known userId.
     * <p>Act:     POST /api/auth/switch-org with a valid orgId and auth header.
     * <p>Assert:  200 OK; new accessToken is returned.
     */
    @Test
    void switchOrg_authenticated_returns200() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID orgId  = UUID.randomUUID();
        when(authService.switchOrg(eq(userId), eq(orgId)))
                .thenReturn(new TokenResponse(NEW_ACCESS_TOKEN, MOCK_REFRESH_TOKEN));

        mockMvc.perform(post(SWITCH_URL)
                        .header("X-User-Id", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SwitchOrgRequest(orgId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value(NEW_ACCESS_TOKEN));
    }

    /**
     * Switch org fails when no X-User-Id header is provided (unauthenticated request).
     *
     * <p>Arrange: No stub needed. No auth header is set.
     * <p>Act:     POST /api/auth/switch-org without X-User-Id header.
     * <p>Assert:  401 Unauthorized — Spring Security rejects the request before reaching the controller.
     */
    @Test
    void switchOrg_noAuthHeader_returns401() throws Exception {
        mockMvc.perform(post(SWITCH_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new SwitchOrgRequest(UUID.randomUUID()))))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Switch org fails when the X-User-Id header is not a valid UUID.
     * JwtAuthenticationFilter skips authentication for malformed headers,
     * leaving the SecurityContext empty → Spring Security returns 401.
     *
     * <p>Arrange: No stub needed. X-User-Id is set to a non-UUID string.
     * <p>Act:     POST /api/auth/switch-org with X-User-Id = "not-a-uuid".
     * <p>Assert:  401 Unauthorized.
     */
    @Test
    void switchOrg_malformedUserId_returns401() throws Exception {
        mockMvc.perform(post(SWITCH_URL)
                        .header("X-User-Id", "not-a-uuid")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new SwitchOrgRequest(UUID.randomUUID()))))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Switch org fails when the orgId field is missing from the body.
     *
     * <p>Arrange: No stub needed. X-User-Id header is present.
     * <p>Act:     POST /api/auth/switch-org with body "{}".
     * <p>Assert:  400 Bad Request; validation error on the "orgId" field.
     */
    @Test
    void switchOrg_missingOrgId_returns400() throws Exception {
        mockMvc.perform(post(SWITCH_URL)
                        .header("X-User-Id", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.orgId").exists());
    }

    /**
     * Switch org fails when the target org does not belong to the user.
     *
     * <p>Arrange: AuthService.switchOrg() throws UserNotFoundException.
     *             X-User-Id header is set to a known userId.
     * <p>Act:     POST /api/auth/switch-org with an orgId the user is not a member of.
     * <p>Assert:  404 Not Found.
     */
    @Test
    void switchOrg_userNotFound_returns404() throws Exception {
        UUID userId = UUID.randomUUID();
        when(authService.switchOrg(any(), any()))
                .thenThrow(new UserNotFoundException(userId));

        mockMvc.perform(post(SWITCH_URL)
                        .header("X-User-Id", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new SwitchOrgRequest(UUID.randomUUID()))))
                .andExpect(status().isNotFound());
    }
}