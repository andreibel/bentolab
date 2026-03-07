package io.bento.boardservice.repository;

import io.bento.boardservice.entity.Label;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LabelRepository extends JpaRepository<Label, UUID> {
    List<Label> findAllByBoard_Id(UUID boardId);
    Optional<Label> findByBoard_IdAndId(UUID boardId, UUID labelId);
    boolean existsByBoard_IdAndName(UUID boardId, String name);
}