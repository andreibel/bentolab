package io.bento.taskservice.repository;

import io.bento.taskservice.entity.Issue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface IssueRepository extends MongoRepository<Issue, String> {

    Optional<Issue> findByOrgIdAndId(String orgId, String id);

    Optional<Issue> findByOrgIdAndIssueKey(String orgId, String issueKey);

    Page<Issue> findAllByOrgIdAndBoardId(String orgId, String boardId, Pageable pageable);

    List<Issue> findAllByOrgIdAndBoardIdAndColumnId(String orgId, String boardId, String columnId);

    List<Issue> findAllByOrgIdAndSprintId(String orgId, String sprintId);

    List<Issue> findAllByOrgIdAndEpicId(String orgId, String epicId);

    List<Issue> findAllByOrgIdAndParentIssueId(String orgId, String parentIssueId);

    long countByOrgIdAndBoardIdAndSprintId(String orgId, String boardId, String sprintId);

    boolean existsByOrgIdAndIssueKey(String orgId, String issueKey);
}
