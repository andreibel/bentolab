package io.bento.attacmentservice.repository;

import io.bento.attacmentservice.entity.Attachment;
import io.bento.attacmentservice.enums.AttachmentStatus;
import io.bento.attacmentservice.enums.EntityType;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface AttachmentRepository extends MongoRepository<Attachment, String> {

    List<Attachment> findByEntityTypeAndEntityIdAndStatus(EntityType entityType, String entityId, AttachmentStatus status);

    Optional<Attachment> findByIdAndUploadedBy(String id, String uploadedBy);
}
