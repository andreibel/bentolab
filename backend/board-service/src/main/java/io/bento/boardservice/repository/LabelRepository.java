package io.bento.boardservice.repository;

import io.bento.boardservice.entity.Label;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LabelRepository extends JpaRepository<Label, UUID> {
    List<Label> findAllByOrgId(UUID orgId);
    Optional<Label> findByOrgIdAndId(UUID orgId, UUID labelId);
    boolean existsByOrgIdAndName(UUID orgId, String name);
}