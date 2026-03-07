package io.bento.boardservice.repository;

import io.bento.boardservice.entity.BoardColumn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BoardColumnRepository extends JpaRepository<BoardColumn, UUID> {
}