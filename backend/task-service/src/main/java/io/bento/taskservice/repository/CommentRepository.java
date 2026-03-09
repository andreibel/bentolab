package io.bento.taskservice.repository;

import io.bento.taskservice.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CommentRepository extends MongoRepository<Comment, String> {

    Optional<Comment> findByOrgIdAndId(String orgId, String id);

    Page<Comment> findAllByOrgIdAndIssueIdAndIsDeletedFalse(String orgId, String issueId, Pageable pageable);
}
