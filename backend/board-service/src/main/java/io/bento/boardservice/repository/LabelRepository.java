package io.bento.boardservice.repository;

import io.bento.boardservice.entity.Label;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface LabelRepository extends JpaRepository<Label, UUID> {
}