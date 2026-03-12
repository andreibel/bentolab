package io.bento.authservice.mapper;

import io.bento.authservice.dto.response.UserDto;
import io.bento.authservice.entity.User;
import io.bento.authservice.enums.SystemRole;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserMapperTest {

    private final UserMapper mapper = new UserMapper();

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID ORG_ID  = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @Test
    void toDto_mapsId() {
        UserDto dto = mapper.toDto(fullUser());
        assertThat(dto.id()).isEqualTo(USER_ID);
    }

    @Test
    void toDto_mapsEmail() {
        UserDto dto = mapper.toDto(fullUser());
        assertThat(dto.email()).isEqualTo("john@example.com");
    }

    @Test
    void toDto_mapsFirstName() {
        UserDto dto = mapper.toDto(fullUser());
        assertThat(dto.firstName()).isEqualTo("John");
    }

    @Test
    void toDto_mapsLastName() {
        UserDto dto = mapper.toDto(fullUser());
        assertThat(dto.lastName()).isEqualTo("Doe");
    }

    @Test
    void toDto_mapsAvatarUrl() {
        UserDto dto = mapper.toDto(fullUser());
        assertThat(dto.avatarUrl()).isEqualTo("https://example.com/avatar.png");
    }

    @Test
    void toDto_mapsSystemRole() {
        UserDto dto = mapper.toDto(fullUser());
        assertThat(dto.systemRole()).isEqualTo(SystemRole.USER);
    }

    @Test
    void toDto_mapsEmailVerified() {
        UserDto dto = mapper.toDto(fullUser());
        assertThat(dto.emailVerified()).isTrue();
    }

    @Test
    void toDto_mapsCurrentOrgId() {
        UserDto dto = mapper.toDto(fullUser());
        assertThat(dto.currentOrgId()).isEqualTo(ORG_ID);
    }

    @Test
    void toDto_mapsLastLoginAt() {
        Instant loginAt = Instant.parse("2026-01-01T00:00:00Z");
        User user = fullUser();
        user.setLastLoginAt(loginAt);

        UserDto dto = mapper.toDto(user);

        assertThat(dto.lastLoginAt()).isEqualTo(loginAt);
    }

    @Test
    void toDto_nullAvatarUrl_mapsAsNull() {
        User user = fullUser();
        user.setAvatarUrl(null);

        assertThat(mapper.toDto(user).avatarUrl()).isNull();
    }

    @Test
    void toDto_nullCurrentOrgId_mapsAsNull() {
        User user = fullUser();
        user.setCurrentOrgId(null);

        assertThat(mapper.toDto(user).currentOrgId()).isNull();
    }

    @Test
    void toDto_nullLastLoginAt_mapsAsNull() {
        User user = fullUser();
        user.setLastLoginAt(null);

        assertThat(mapper.toDto(user).lastLoginAt()).isNull();
    }

    @Test
    void toDto_createdAtIsPreserved() {
        Instant created = Instant.parse("2025-06-01T10:00:00Z");
        User user = User.builder()
                .id(USER_ID).email("a@b.com").password("x")
                .firstName("A").lastName("B")
                .createdAt(created).build();

        assertThat(mapper.toDto(user).createdAt()).isEqualTo(created);
    }

    // =========================================================================
    // Helper
    // =========================================================================

    private User fullUser() {
        return User.builder()
                .id(USER_ID)
                .email("john@example.com")
                .password("hashed")
                .firstName("John")
                .lastName("Doe")
                .avatarUrl("https://example.com/avatar.png")
                .systemRole(SystemRole.USER)
                .emailVerified(true)
                .currentOrgId(ORG_ID)
                .lastLoginAt(Instant.now())
                .build();
    }
}
