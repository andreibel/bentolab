package io.bento.boardservice.repository;

import io.bento.boardservice.entity.BoardPermission;
import io.bento.boardservice.enums.BoardPermissionKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BoardPermissionRepository extends JpaRepository<BoardPermission, UUID> {

    List<BoardPermission> findAllByBoardId(UUID boardId);

    Optional<BoardPermission> findByBoardIdAndPermissionKey(UUID boardId, BoardPermissionKey permissionKey);

    boolean existsByBoardId(UUID boardId);
}