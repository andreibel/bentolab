---
title: Attachment Service API
description: REST API reference for Bento's attachment-service — file uploads and downloads via MinIO.
outline: [2, 3]
---

# Attachment Service API

Base path: `/api/attachments`

File uploads follow a two-step flow: first request a pre-signed URL, then upload the file directly to MinIO, then confirm the upload with the service.

## AttachmentController

### POST /api/attachments/presign

Request a pre-signed URL for uploading a file to MinIO.

**Auth**: required  
**Roles**: OWNER, ADMIN, MEMBER

**Request**:
```json
{
  "issueId": "acme-42",
  "fileName": "architecture.png",
  "contentType": "image/png",
  "fileSize": 204800
}
```

**Response** `200`:
```json
{
  "attachmentId": "att-uuid",
  "uploadUrl": "https://minio.example.com/bento-attachments/...",
  "expiresAt": "2026-04-24T10:05:00Z"
}
```

The client uses the `uploadUrl` to `PUT` the file directly to MinIO with the `Content-Type` header matching `contentType`. This keeps large file transfer off the application servers.

### POST /api/attachments/{id}/confirm

Confirm that the file was uploaded successfully.

**Auth**: required  
**Roles**: OWNER, ADMIN, MEMBER

**Response** `200`: attachment metadata object.

After confirmation, the attachment service publishes `AttachmentUploadedEvent` to Kafka and the attachment appears on the issue.

### GET /api/attachments

List attachments for an issue.

**Auth**: required  
**Roles**: board member

**Query params**: `issueId=<id>`

**Response** `200`:
```json
[
  {
    "id": "att-uuid",
    "issueId": "acme-42",
    "fileName": "architecture.png",
    "contentType": "image/png",
    "fileSize": 204800,
    "uploadedBy": "550e8400-...",
    "uploadedAt": "2026-04-24T10:00:00Z"
  }
]
```

### GET /api/attachments/{id}/download-url

Get a short-lived pre-signed download URL for an attachment.

**Auth**: required  
**Roles**: board member

**Response** `200`:
```json
{
  "downloadUrl": "https://minio.example.com/bento-attachments/...",
  "expiresAt": "2026-04-24T10:05:00Z"
}
```

### DELETE /api/attachments/{id}

Delete an attachment and remove it from MinIO.

**Auth**: required  
**Roles**: uploader, OWNER, ADMIN

**Response** `204`: no body.
