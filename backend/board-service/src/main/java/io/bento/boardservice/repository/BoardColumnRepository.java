package io.bento.boardservice.repository;

import io.bento.boardservice.entity.BoardColumn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BoardColumnRepository extends JpaRepository<BoardColumn, UUID> {
    List<BoardColumn> findAllByBoard_IdOrderByPosition(UUID boardId);
    Optional<BoardColumn> findByBoard_IdAndId(UUID boardId, UUID columnId);
    boolean existsByBoard_IdAndName(UUID boardId, String name);
}