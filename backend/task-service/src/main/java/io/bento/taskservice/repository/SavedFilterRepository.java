package io.bento.taskservice.repository;

import io.bento.taskservice.entity.SavedFilter;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SavedFilterRepository extends MongoRepository<SavedFilter, String> {

    Optional<SavedFilter> findByOrgIdAndId(String orgId, String id);

    List<SavedFilter> findAllByOrgIdAndBoardIdAndUserId(String orgId, String boardId, String userId);

    List<SavedFilter> findAllByOrgIdAndBoardIdAndIsSharedTrue(String orgId, String boardId);
}
