package io.bento.taskservice.repository;

import io.bento.taskservice.entity.Issue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface IssueRepository extends MongoRepository<Issue, String> {

    Optional<Issue> findByOrgIdAndId(String orgId, String id);

    Optional<Issue> findByOrgIdAndIssueKey(String orgId, String issueKey);

    Page<Issue> findAllByOrgIdAndBoardId(String orgId, String boardId, Pageable pageable);

    // Matches closed == true only
    Page<Issue> findAllByOrgIdAndBoardIdAndClosed(String orgId, String boardId, boolean closed, Pageable pageable);

    // Matches closed == false OR closed field absent/null (for existing docs without the field)
    @Query("{'orgId': ?0, 'boardId': ?1, 'closed': {$ne: true}}")
    Page<Issue> findAllOpenByOrgIdAndBoardId(String orgId, String boardId, Pageable pageable);

    List<Issue> findAllByOrgIdAndBoardIdAndColumnId(String orgId, String boardId, String columnId);

    List<Issue> findAllByOrgIdAndSprintId(String orgId, String sprintId);

    List<Issue> findAllByOrgIdAndEpicId(String orgId, String epicId);

    List<Issue> findAllByOrgIdAndParentIssueId(String orgId, String parentIssueId);

    long countByOrgIdAndBoardIdAndSprintId(String orgId, String boardId, String sprintId);

    long countByOrgIdAndEpicId(String orgId, String epicId);

    Page<Issue> findAllByOrgIdAndEpicId(String orgId, String epicId, Pageable pageable);

    boolean existsByOrgIdAndIssueKey(String orgId, String issueKey);

    // ── My Issues (cross-board by userId) ─────────────────────────────────────

    @Query("{'orgId': ?0, 'assigneeId': ?1}")
    Page<Issue> findAllByOrgIdAndAssigneeId(String orgId, String assigneeId, Pageable pageable);

    @Query("{'orgId': ?0, 'assigneeId': ?1, 'closed': {$ne: true}}")
    Page<Issue> findAllOpenByOrgIdAndAssigneeId(String orgId, String assigneeId, Pageable pageable);

    @Query("{'orgId': ?0, 'assigneeId': ?1, 'closed': true}")
    Page<Issue> findAllClosedByOrgIdAndAssigneeId(String orgId, String assigneeId, Pageable pageable);

    @Query("{'orgId': ?0, 'reporterId': ?1}")
    Page<Issue> findAllByOrgIdAndReporterId(String orgId, String reporterId, Pageable pageable);

    @Query("{'orgId': ?0, 'reporterId': ?1, 'closed': {$ne: true}}")
    Page<Issue> findAllOpenByOrgIdAndReporterId(String orgId, String reporterId, Pageable pageable);

    @Query("{'orgId': ?0, 'reporterId': ?1, 'closed': true}")
    Page<Issue> findAllClosedByOrgIdAndReporterId(String orgId, String reporterId, Pageable pageable);

    @Query("{'orgId': ?0, '$or': [{'assigneeId': ?1}, {'reporterId': ?1}]}")
    Page<Issue> findAllByOrgIdAndUserId(String orgId, String userId, Pageable pageable);

    @Query("{'orgId': ?0, '$or': [{'assigneeId': ?1}, {'reporterId': ?1}], 'closed': {$ne: true}}")
    Page<Issue> findAllOpenByOrgIdAndUserId(String orgId, String userId, Pageable pageable);

    @Query("{'orgId': ?0, '$or': [{'assigneeId': ?1}, {'reporterId': ?1}], 'closed': true}")
    Page<Issue> findAllClosedByOrgIdAndUserId(String orgId, String userId, Pageable pageable);

    // ── Full-text search ──────────────────────────────────────────────────────

    @Query("{'orgId': ?0, '$or': [{'title': {$regex: ?1, $options: 'i'}}, {'description': {$regex: ?1, $options: 'i'}}]}")
    List<Issue> searchByOrgIdAndText(String orgId, String regex, Pageable pageable);
}
