---
title: File Storage (MinIO)
description: Configure MinIO for file attachments in Bento, including bucket setup and migrating to AWS S3.
outline: [2, 3]
---

# File Storage (MinIO)

Bento stores file attachments in MinIO, an S3-compatible object store. The `docker-compose.beta.yml` includes a MinIO container pre-configured to work with the attachment service.

## Default configuration

The MinIO container runs on the host with its API on port 9000 and its web console on port 9001. Credentials come from your `.env` file:

```bash
MINIO_ROOT_USER=your-access-key
MINIO_ROOT_PASSWORD=your-secret-key
```

Data is persisted in the `minio_data` Docker volume. The attachment service connects to MinIO over the internal Docker network at `http://minio:9000`.

<!-- SCREENSHOT: images/minio-console.png — MinIO console at :9001, buckets listed -->

## Creating the bucket

On first run, Bento's attachment service creates the required bucket automatically. If the bucket is missing, attachments will fail. You can verify or create the bucket manually from the MinIO console:

1. Open `http://localhost:9001` in your browser.
2. Log in with `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`.
3. Navigate to **Buckets** in the left sidebar.
4. Confirm a bucket named `bento-attachments` exists. If not, click the primary action button to create it.

## Console

The MinIO console at `http://localhost:9001` lets you:

- Browse uploaded files
- View bucket policies
- Manage access keys
- Monitor storage usage

<!-- SCREENSHOT: images/minio-bucket.png — bucket contents after uploading one attachment -->

::: warning Expose MinIO with care
The MinIO console and API (port 9001 and 9000) should not be exposed to the public internet directly. Access them via an internal network or an authenticated reverse proxy.
:::

## Using AWS S3 instead

To replace MinIO with AWS S3:

1. Create an S3 bucket in your AWS account (e.g. `bento-attachments`).
2. Create an IAM user with `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` permissions on that bucket.
3. Update the attachment service environment variables in your compose file:

```yaml
MINIO_ENDPOINT: https://s3.amazonaws.com
MINIO_BUCKET: bento-attachments
MINIO_ROOT_USER: <AWS_ACCESS_KEY_ID>
MINIO_ROOT_PASSWORD: <AWS_SECRET_ACCESS_KEY>
MINIO_REGION: us-east-1
```

<!-- TODO: confirm with maintainer — exact env var names for S3 region and endpoint override -->

4. Remove the `minio` container from the compose file — it is no longer needed.

::: tip Other S3-compatible stores
Cloudflare R2, Backblaze B2, and DigitalOcean Spaces all work as drop-in replacements for MinIO using the same environment variables. Point `MINIO_ENDPOINT` at the provider's S3-compatible endpoint.
:::
