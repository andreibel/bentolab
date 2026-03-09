package io.bento.taskservice.repository;

import io.bento.taskservice.entity.Sprint;
import io.bento.taskservice.enums.SprintStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SprintRepository extends MongoRepository<Sprint, String> {

    Optional<Sprint> findByOrgIdAndId(String orgId, String id);

    List<Sprint> findAllByOrgIdAndBoardId(String orgId, String boardId);

    Optional<Sprint> findByOrgIdAndBoardIdAndStatus(String orgId, String boardId, SprintStatus status);

    boolean existsByOrgIdAndBoardIdAndStatus(String orgId, String boardId, SprintStatus status);
}
