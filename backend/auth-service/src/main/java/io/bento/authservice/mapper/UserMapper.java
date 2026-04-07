package io.bento.authservice.mapper;

import io.bento.authservice.dto.response.UserDto;
import io.bento.authservice.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDto toDto(User user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getAvatarUrl(),
                user.getSystemRole(),
                user.isEmailVerified(),
                user.getCurrentOrgId(),
                user.getLocale(),
                user.getTimezone(),
                user.getLastLoginAt(),
                user.getCreatedAt()
        );
    }
}
