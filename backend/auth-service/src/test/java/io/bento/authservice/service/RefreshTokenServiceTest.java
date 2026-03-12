package io.bento.authservice.service;

import io.bento.authservice.config.JwtProperties;
import io.bento.authservice.entity.RefreshToken;
import io.bento.authservice.entity.User;
import io.bento.authservice.enums.SystemRole;
import io.bento.authservice.exception.InvalidTokenException;
import io.bento.authservice.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private JwtProperties jwtProperties;

    @InjectMocks private RefreshTokenService refreshTokenService;

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final long REFRESH_EXPIRATION_MS = 604_800_000L; // 7 days

    @BeforeEach
    void setUp() {
        // lenient: expiration is only consumed by createRefreshToken paths
        lenient().when(jwtProperties.refreshTokenExpiration()).thenReturn(REFRESH_EXPIRATION_MS);
    }

    // =========================================================================
    // createRefreshToken
    // =========================================================================

    @Test
    void createRefreshToken_savesTokenWithCorrectFields() {
        User user = user();
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RefreshToken result = refreshTokenService.createRefreshToken(user, "Chrome/Mac", "1.2.3.4");

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());

        RefreshToken saved = captor.getValue();
        assertThat(saved.getUser()).isEqualTo(user);
        assertThat(saved.getToken()).isNotBlank();
        assertThat(saved.getDeviceInfo()).isEqualTo("Chrome/Mac");
        assertThat(saved.getIpAddress()).isEqualTo("1.2.3.4");
        assertThat(saved.isRevoked()).isFalse();
    }

    @Test
    void createRefreshToken_expiryIsApproximatelySevenDaysFromNow() {
        User user = user();
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RefreshToken result = refreshTokenService.createRefreshToken(user, null, null);

        Instant expectedExpiry = Instant.now().plus(7, ChronoUnit.DAYS);
        assertThat(result.getExpiresAt())
                .isAfter(expectedExpiry.minus(5, ChronoUnit.SECONDS))
                .isBefore(expectedExpiry.plus(5, ChronoUnit.SECONDS));
    }

    @Test
    void createRefreshToken_generatesUniqueTokenStrings() {
        User user = user();
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RefreshToken t1 = refreshTokenService.createRefreshToken(user, null, null);
        RefreshToken t2 = refreshTokenService.createRefreshToken(user, null, null);

        assertThat(t1.getToken()).isNotEqualTo(t2.getToken());
    }

    // =========================================================================
    // validateRefreshToken
    // =========================================================================

    @Test
    void validateRefreshToken_validToken_returnsToken() {
        RefreshToken token = activeToken("tok");
        when(refreshTokenRepository.findByToken("tok")).thenReturn(Optional.of(token));

        RefreshToken result = refreshTokenService.validateRefreshToken("tok");

        assertThat(result).isEqualTo(token);
    }

    @Test
    void validateRefreshToken_unknownToken_throwsInvalidTokenException() {
        when(refreshTokenRepository.findByToken("bad")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> refreshTokenService.validateRefreshToken("bad"))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void validateRefreshToken_revokedToken_throwsInvalidTokenException() {
        RefreshToken revoked = RefreshToken.builder()
                .token("revoked").user(user())
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(true).build();
        when(refreshTokenRepository.findByToken("revoked")).thenReturn(Optional.of(revoked));

        assertThatThrownBy(() -> refreshTokenService.validateRefreshToken("revoked"))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("revoked");
    }

    @Test
    void validateRefreshToken_expiredToken_throwsInvalidTokenException() {
        RefreshToken expired = RefreshToken.builder()
                .token("expired").user(user())
                .expiresAt(Instant.now().minusSeconds(1))
                .revoked(false).build();
        when(refreshTokenRepository.findByToken("expired")).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> refreshTokenService.validateRefreshToken("expired"))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("expired");
    }

    // =========================================================================
    // revokeToken
    // =========================================================================

    @Test
    void revokeToken_existingToken_setsRevokedTrue() {
        RefreshToken token = activeToken("tok");
        when(refreshTokenRepository.findByToken("tok")).thenReturn(Optional.of(token));

        refreshTokenService.revokeToken("tok");

        assertThat(token.isRevoked()).isTrue();
        verify(refreshTokenRepository).save(token);
    }

    @Test
    void revokeToken_unknownToken_throwsInvalidTokenException() {
        when(refreshTokenRepository.findByToken("bad")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> refreshTokenService.revokeToken("bad"))
                .isInstanceOf(InvalidTokenException.class);
    }

    // =========================================================================
    // getOrCreateActiveToken
    // =========================================================================

    @Test
    void getOrCreateActiveToken_activeTokenExists_returnsExisting() {
        User user = user();
        RefreshToken existing = activeToken("existing-tok");
        when(refreshTokenRepository.findLatestActiveByUserId(eq(USER_ID), any(Instant.class)))
                .thenReturn(Optional.of(existing));

        RefreshToken result = refreshTokenService.getOrCreateActiveToken(user);

        assertThat(result).isEqualTo(existing);
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void getOrCreateActiveToken_noActiveToken_createsNew() {
        User user = user();
        when(refreshTokenRepository.findLatestActiveByUserId(eq(USER_ID), any(Instant.class)))
                .thenReturn(Optional.empty());
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RefreshToken result = refreshTokenService.getOrCreateActiveToken(user);

        assertThat(result).isNotNull();
        assertThat(result.getToken()).isNotBlank();
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    // =========================================================================
    // revokeAllUserTokens
    // =========================================================================

    @Test
    void revokeAllUserTokens_delegatesToRepository() {
        refreshTokenService.revokeAllUserTokens(USER_ID);
        verify(refreshTokenRepository).revokeAllByUserId(USER_ID);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private User user() {
        return User.builder()
                .id(USER_ID)
                .email("john@example.com")
                .password("hashed")
                .firstName("John")
                .lastName("Doe")
                .systemRole(SystemRole.USER)
                .active(true)
                .build();
    }

    private RefreshToken activeToken(String token) {
        return RefreshToken.builder()
                .token(token)
                .user(user())
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .build();
    }
}
