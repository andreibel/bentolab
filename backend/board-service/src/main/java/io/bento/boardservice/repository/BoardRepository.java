package io.bento.boardservice.repository;

import io.bento.boardservice.entity.Board;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BoardRepository extends JpaRepository<Board, UUID> {
    List<Board> findAllByOrgId(UUID orgId);
    boolean existsByOrgIdAndBoardKey(UUID orgId, String boardKey);
}