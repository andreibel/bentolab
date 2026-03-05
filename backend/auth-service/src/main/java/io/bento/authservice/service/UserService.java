package io.bento.authservice.service;

import io.bento.authservice.dto.request.UpdateUserRequest;
import io.bento.authservice.dto.response.UserDto;
import io.bento.authservice.entity.User;
import io.bento.authservice.event.UserEventPublisher;
import io.bento.authservice.event.UserUpdatedEvent;
import io.bento.authservice.exception.UserNotFoundException;
import io.bento.authservice.mapper.UserMapper;
import io.bento.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final UserEventPublisher userEventPublisher;

    public UserDto getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        return userMapper.toDto(user);
    }

    @Transactional
    public UserDto updateCurrentUser(UUID userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }

        user = userRepository.save(user);

        List<String> changedFields = new ArrayList<>();
        if (request.firstName() != null) changedFields.add("firstName");
        if (request.lastName() != null) changedFields.add("lastName");
        if (request.avatarUrl() != null) changedFields.add("avatarUrl");
        userEventPublisher.publishUserUpdated(new UserUpdatedEvent(userId, changedFields, Instant.now()));

        return userMapper.toDto(user);
    }
}
