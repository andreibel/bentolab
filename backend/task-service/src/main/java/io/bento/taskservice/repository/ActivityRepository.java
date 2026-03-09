package io.bento.taskservice.repository;

import io.bento.taskservice.entity.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ActivityRepository extends MongoRepository<Activity, String> {

    Page<Activity> findAllByOrgIdAndIssueId(String orgId, String issueId, Pageable pageable);

    Page<Activity> findAllByOrgIdAndBoardId(String orgId, String boardId, Pageable pageable);
}
