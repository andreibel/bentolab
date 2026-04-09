package io.bento.attacmentservice.enums;

public enum AttachmentStatus {
    PENDING,    // presigned URL issued, upload not yet confirmed
    CONFIRMED,  // upload confirmed by client
    DELETED     // soft-deleted
}
