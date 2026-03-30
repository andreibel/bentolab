package io.bento.authservice.service;

import io.bento.authservice.dto.request.UpdateUserRequest;
import io.bento.authservice.dto.response.UserDto;
import io.bento.authservice.entity.User;
import io.bento.authservice.enums.SystemRole;
import io.bento.authservice.event.UserEventPublisher;
import io.bento.kafka.event.UserUpdatedEvent;
import io.bento.authservice.exception.UserNotFoundException;
import io.bento.authservice.mapper.UserMapper;
import io.bento.authservice.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserMapper userMapper;
    @Mock private UserEventPublisher userEventPublisher;

    @InjectMocks private UserService userService;

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    // =========================================================================
    // getCurrentUser
    // =========================================================================

    @Test
    void getCurrentUser_existingUser_returnsUserDto() {
        User user = user();
        UserDto dto = userDto();

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userMapper.toDto(user)).thenReturn(dto);

        UserDto result = userService.getCurrentUser(USER_ID);

        assertThat(result).isEqualTo(dto);
    }

    @Test
    void getCurrentUser_unknownUser_throwsUserNotFoundException() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getCurrentUser(USER_ID))
                .isInstanceOf(UserNotFoundException.class);
    }

    // =========================================================================
    // updateCurrentUser
    // =========================================================================

    @Test
    void updateCurrentUser_allFieldsProvided_updatesAllAndPublishesEvent() {
        User user = user();
        UpdateUserRequest request = new UpdateUserRequest("Jane", "Smith", "https://img.example.com/avatar.png");

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        when(userMapper.toDto(user)).thenReturn(userDto());

        userService.updateCurrentUser(USER_ID, request);

        assertThat(user.getFirstName()).isEqualTo("Jane");
        assertThat(user.getLastName()).isEqualTo("Smith");
        assertThat(user.getAvatarUrl()).isEqualTo("https://img.example.com/avatar.png");

        ArgumentCaptor<UserUpdatedEvent> captor = ArgumentCaptor.forClass(UserUpdatedEvent.class);
        verify(userEventPublisher).publishUserUpdated(captor.capture());
        assertThat(captor.getValue().changedFields())
                .containsExactlyInAnyOrder("firstName", "lastName", "avatarUrl");
    }

    @Test
    void updateCurrentUser_firstNameOnly_onlyFirstNameInChangedFields() {
        User user = user();
        UpdateUserRequest request = new UpdateUserRequest("Jane", null, null);

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        when(userMapper.toDto(user)).thenReturn(userDto());

        userService.updateCurrentUser(USER_ID, request);

        assertThat(user.getFirstName()).isEqualTo("Jane");
        assertThat(user.getLastName()).isEqualTo("Doe"); // unchanged

        ArgumentCaptor<UserUpdatedEvent> captor = ArgumentCaptor.forClass(UserUpdatedEvent.class);
        verify(userEventPublisher).publishUserUpdated(captor.capture());
        assertThat(captor.getValue().changedFields()).containsExactly("firstName");
    }

    @Test
    void updateCurrentUser_noFieldsProvided_publishesEventWithEmptyChangedFields() {
        User user = user();
        UpdateUserRequest request = new UpdateUserRequest(null, null, null);

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        when(userMapper.toDto(user)).thenReturn(userDto());

        userService.updateCurrentUser(USER_ID, request);

        // Event is still published — caller decides what to do with empty changed fields
        ArgumentCaptor<UserUpdatedEvent> captor = ArgumentCaptor.forClass(UserUpdatedEvent.class);
        verify(userEventPublisher).publishUserUpdated(captor.capture());
        assertThat(captor.getValue().changedFields()).isEmpty();
    }

    @Test
    void updateCurrentUser_unknownUser_throwsUserNotFoundException() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                userService.updateCurrentUser(USER_ID, new UpdateUserRequest("Jane", null, null)))
                .isInstanceOf(UserNotFoundException.class);

        verify(userRepository, never()).save(any());
        verify(userEventPublisher, never()).publishUserUpdated(any());
    }

    @Test
    void updateCurrentUser_avatarUrlOnly_onlyAvatarInChangedFields() {
        User user = user();
        UpdateUserRequest request = new UpdateUserRequest(null, null, "https://cdn.example.com/new.png");

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        when(userMapper.toDto(user)).thenReturn(userDto());

        userService.updateCurrentUser(USER_ID, request);

        assertThat(user.getAvatarUrl()).isEqualTo("https://cdn.example.com/new.png");

        ArgumentCaptor<UserUpdatedEvent> captor = ArgumentCaptor.forClass(UserUpdatedEvent.class);
        verify(userEventPublisher).publishUserUpdated(captor.capture());
        assertThat(captor.getValue().changedFields()).containsExactly("avatarUrl");
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
                .emailVerified(false)
                .build();
    }

    private UserDto userDto() {
        return new UserDto(USER_ID, "john@example.com", "John", "Doe",
                null, SystemRole.USER, false, null, null, Instant.now());
    }
}
