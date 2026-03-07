package io.bento.boardservice.repository;

import io.bento.boardservice.entity.BoardMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BoardMemberRepository extends JpaRepository<BoardMember, UUID> {
}