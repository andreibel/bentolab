package io.bento.taskservice.repository;

import io.bento.taskservice.entity.Epic;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface EpicRepository extends MongoRepository<Epic, String> {

    List<Epic> findAllByOrgIdAndBoardId(String orgId, String boardId);

    Optional<Epic> findByIdAndOrgId(String id, String orgId);

    boolean existsByIdAndOrgId(String id, String orgId);
}