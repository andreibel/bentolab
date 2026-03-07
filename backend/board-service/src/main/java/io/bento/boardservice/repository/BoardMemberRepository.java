package io.bento.boardservice.repository;

import io.bento.boardservice.entity.BoardMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BoardMemberRepository extends JpaRepository<BoardMember, UUID> {
    List<BoardMember> findAllByBoard_Id(UUID boardId);
    List<BoardMember> findAllByUserId(UUID userId);
    Optional<BoardMember> findByBoard_IdAndUserId(UUID boardId, UUID userId);
    boolean existsByBoard_IdAndUserId(UUID boardId, UUID userId);
}