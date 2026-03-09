package io.bento.taskservice.repository;

import io.bento.taskservice.entity.TimeLog;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface TimeLogRepository extends MongoRepository<TimeLog, String> {

    Optional<TimeLog> findByOrgIdAndId(String orgId, String id);

    List<TimeLog> findAllByOrgIdAndIssueId(String orgId, String issueId);

    List<TimeLog> findAllByOrgIdAndUserId(String orgId, String userId);
}
