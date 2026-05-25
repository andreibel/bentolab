---
title: Attachments
description: How to upload and manage file attachments on issues in Bento.
outline: [2, 3]
---

# Attachments

You can attach files to any issue. Files are stored in MinIO (or your configured S3-compatible store) and linked to the issue. Attachments are visible to all members with access to the board.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Upload attachments | ✅ | ✅ | ✅ | ❌ |
| View / download attachments | ✅ | ✅ | ✅ | ✅ |
| Delete attachments | ✅ | ✅ | ✅ (own) | ❌ |

## Steps

1. Open the issue detail view.
2. Navigate to the **Attachments** tab.
3. Click the upload area, or drag and drop files directly onto it.
4. A progress indicator appears while the file uploads to MinIO.
5. When the upload completes, the file appears in the attachments list with a thumbnail (for images) or a file icon.
6. Click a file name or thumbnail to download it. Image thumbnails open in a preview.

<!-- SCREENSHOT: images/issue-attachments.png — attachments tab with image thumb + PDF row -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/attachment-upload-progress.png — mid-upload progress bar -->

## Size limits

<!-- TODO: confirm with maintainer — maximum attachment file size -->

## Supported types

All file types are accepted. The following types receive thumbnail previews:

- Images: JPEG, PNG, GIF, WebP, SVG
- PDFs show a PDF icon without inline preview

Other file types show a generic file icon and can be downloaded.

## Troubleshooting

- **Upload fails immediately** — Check that the attachment service and MinIO are running. See [Troubleshooting](../../self-host/troubleshooting.md#attachment-upload-fails).
- **Upload times out** — If you are behind Nginx, increase `client_max_body_size`. See [Reverse Proxy & TLS](../../self-host/reverse-proxy.md#common-pitfalls).
- **File not appearing after upload** — Refresh the attachments tab. If the file still does not appear, check the attachment service logs.
