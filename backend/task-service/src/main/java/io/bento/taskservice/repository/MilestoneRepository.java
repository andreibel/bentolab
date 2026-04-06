package io.bento.taskservice.repository;

import io.bento.taskservice.entity.Milestone;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface MilestoneRepository extends MongoRepository<Milestone, String> {

    List<Milestone> findAllByOrgIdAndBoardId(String orgId, String boardId);

    Optional<Milestone> findByIdAndOrgId(String id, String orgId);
}