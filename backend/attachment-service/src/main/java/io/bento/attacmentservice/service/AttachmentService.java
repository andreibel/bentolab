package io.bento.attacmentservice.service;

import io.bento.attacmentservice.config.StorageProperties;
import io.bento.attacmentservice.dto.request.PresignRequest;
import io.bento.attacmentservice.dto.response.AttachmentResponse;
import io.bento.attacmentservice.dto.response.PresignResponse;
import io.bento.attacmentservice.entity.Attachment;
import io.bento.attacmentservice.enums.AttachmentStatus;
import io.bento.attacmentservice.enums.EntityType;
import io.bento.attacmentservice.repository.AttachmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final StorageService storageService;
    private final StorageProperties storageProperties;

    public PresignResponse presign(PresignRequest req, String userId) {
        String s3Key = buildS3Key(req.entityType(), req.entityId(), req.orgId(), req.fileName());

        Attachment attachment = Attachment.builder()
                .entityType(req.entityType())
                .entityId(req.entityId())
                .orgId(req.orgId())
                .fileName(req.fileName())
                .contentType(req.contentType())
                .size(req.size())
                .s3Key(s3Key)
                .status(AttachmentStatus.PENDING)
                .uploadedBy(userId)
                .createdAt(Instant.now())
                .build();

        attachment = attachmentRepository.save(attachment);

        String uploadUrl = storageService.generateUploadUrl(s3Key, req.contentType());

        return new PresignResponse(attachment.getId(), uploadUrl, storageProperties.uploadUrlExpiryMinutes());
    }

    public AttachmentResponse confirm(String attachmentId, String userId) {
        Attachment attachment = attachmentRepository.findByIdAndUploadedBy(attachmentId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));

        if (attachment.getStatus() != AttachmentStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Attachment is not in PENDING state");
        }

        attachment.setStatus(AttachmentStatus.CONFIRMED);
        attachment.setConfirmedAt(Instant.now());
        attachmentRepository.save(attachment);

        return toResponse(attachment);
    }

    public List<AttachmentResponse> listByEntity(EntityType entityType, String entityId) {
        return attachmentRepository.findByEntityTypeAndEntityIdAndStatus(entityType, entityId, AttachmentStatus.CONFIRMED)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public void delete(String attachmentId, String userId) {
        Attachment attachment = attachmentRepository.findByIdAndUploadedBy(attachmentId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));

        if (attachment.getStatus() == AttachmentStatus.DELETED) {
            throw new ResponseStatusException(HttpStatus.GONE, "Attachment already deleted");
        }

        storageService.delete(attachment.getS3Key());
        attachment.setStatus(AttachmentStatus.DELETED);
        attachment.setDeletedAt(Instant.now());
        attachmentRepository.save(attachment);
    }

    public String getDownloadUrl(String attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));

        if (attachment.getStatus() != AttachmentStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not available");
        }

        return resolveUrl(attachment);
    }

    private boolean isPublicType(EntityType type) {
        return type == EntityType.USER_AVATAR || type == EntityType.ORG_LOGO;
    }

    /** Public types get a permanent URL; everything else gets a time-limited presigned URL. */
    private String resolveUrl(Attachment a) {
        return isPublicType(a.getEntityType())
                ? storageService.generatePublicUrl(a.getS3Key())
                : storageService.generateDownloadUrl(a.getS3Key());
    }

    private AttachmentResponse toResponse(Attachment a) {
        String downloadUrl = null;
        if (a.getStatus() == AttachmentStatus.CONFIRMED) {
            downloadUrl = resolveUrl(a);
        }
        return new AttachmentResponse(
                a.getId(),
                a.getEntityType(),
                a.getEntityId(),
                a.getOrgId(),
                a.getFileName(),
                a.getContentType(),
                a.getSize(),
                a.getStatus(),
                a.getUploadedBy(),
                downloadUrl,
                a.getCreatedAt()
        );
    }

    private String buildS3Key(EntityType entityType, String entityId, String orgId, String fileName) {
        String ext = fileName.contains(".") ? fileName.substring(fileName.lastIndexOf('.')) : "";
        String uniqueName = UUID.randomUUID() + ext;
        return switch (entityType) {
            case ISSUE -> "orgs/%s/issues/%s/%s".formatted(orgId, entityId, uniqueName);
            case COMMENT -> "orgs/%s/comments/%s/%s".formatted(orgId, entityId, uniqueName);
            case USER_AVATAR -> "avatars/%s/%s".formatted(entityId, uniqueName);
            case ORG_LOGO -> "orgs/%s/logo/%s".formatted(entityId, uniqueName);
        };
    }
}
