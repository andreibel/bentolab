package io.bento.attacmentservice.controller;

import io.bento.attacmentservice.dto.request.PresignRequest;
import io.bento.attacmentservice.dto.response.AttachmentResponse;
import io.bento.attacmentservice.dto.response.PresignResponse;
import io.bento.attacmentservice.enums.EntityType;
import io.bento.attacmentservice.service.AttachmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    /**
     * Step 1: Request a presigned PUT URL.
     * Returns an uploadUrl the client uses to upload directly to S3.
     */
    @PostMapping("/presign")
    public ResponseEntity<PresignResponse> presign(
            @Valid @RequestBody PresignRequest request,
            @AuthenticationPrincipal UUID userId) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(attachmentService.presign(request, userId.toString()));
    }

    /**
     * Step 2: Confirm the upload completed successfully.
     * Must be called after the client finishes the S3 PUT.
     */
    @PostMapping("/{id}/confirm")
    public ResponseEntity<AttachmentResponse> confirm(
            @PathVariable String id,
            @AuthenticationPrincipal UUID userId) {

        return ResponseEntity.ok(attachmentService.confirm(id, userId.toString()));
    }

    /**
     * List all confirmed attachments for a given entity.
     */
    @GetMapping
    public ResponseEntity<List<AttachmentResponse>> list(
            @RequestParam EntityType entityType,
            @RequestParam String entityId) {

        return ResponseEntity.ok(attachmentService.listByEntity(entityType, entityId));
    }

    /**
     * Get a short-lived presigned GET URL to download a specific attachment.
     */
    @GetMapping("/{id}/download-url")
    public ResponseEntity<Map<String, String>> downloadUrl(@PathVariable String id) {
        return ResponseEntity.ok(Map.of("url", attachmentService.getDownloadUrl(id)));
    }

    /**
     * Soft-delete an attachment (only the uploader can delete).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable String id,
            @AuthenticationPrincipal UUID userId) {

        attachmentService.delete(id, userId.toString());
        return ResponseEntity.noContent().build();
    }
}
