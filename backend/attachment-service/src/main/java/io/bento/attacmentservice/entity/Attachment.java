package io.bento.attacmentservice.entity;

import io.bento.attacmentservice.enums.AttachmentStatus;
import io.bento.attacmentservice.enums.EntityType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "attachments")
@CompoundIndexes({
        @CompoundIndex(name = "idx_entity", def = "{'entityType': 1, 'entityId': 1}"),
        @CompoundIndex(name = "idx_org_entity", def = "{'orgId': 1, 'entityType': 1, 'entityId': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Attachment {

    @Id
    private String id;

    private EntityType entityType;
    private String entityId;
    private String orgId;

    private String fileName;
    private String contentType;
    private Long size;              // bytes

    private String s3Key;           // internal S3 object key

    @Builder.Default
    private AttachmentStatus status = AttachmentStatus.PENDING;

    private String uploadedBy;      // userId

    private Instant createdAt;
    private Instant confirmedAt;
    private Instant deletedAt;
}
