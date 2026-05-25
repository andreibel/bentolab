---
title: API Overview
description: Overview of the Bento REST API — base URL, authentication, rate limits, errors, and versioning.
outline: [2, 3]
---

# API Overview

Bento exposes a REST API through the API gateway on port 8080. All endpoints are prefixed with `/api/`. The frontend uses this same API — there is no separate public API.

## Base URL

```
http://localhost:8080
```

In production, replace `localhost:8080` with your public domain (e.g. `https://bento.example.com`). If running behind a reverse proxy that serves on port 443, no port is needed.

## Authentication

Most endpoints require a JWT access token in the `Authorization` header:

```http
Authorization: Bearer <access_token>
```

Obtain an access token via `POST /api/auth/login`. Access tokens expire — use `POST /api/auth/refresh` to get a new one without re-entering credentials.

Endpoints listed as `**Auth**: public` do not require a token.

## Rate limits

<!-- TODO: confirm with maintainer — rate limit values and headers -->

Rate limiting is applied by the API gateway at the IP level. Exceeded limits return `429 Too Many Requests`.

## Errors

All error responses use this envelope:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description",
  "timestamp": "2026-04-24T10:00:00Z"
}
```

| HTTP status | Meaning |
|---|---|
| 400 | Bad request — invalid input |
| 401 | Unauthenticated or stale token |
| 403 | Authenticated but insufficient role |
| 404 | Resource not found |
| 409 | Conflict (duplicate slug, etc.) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

The special `{"error":"TOKEN_STALE"}` 401 response means your JWT was invalidated server-side. Call `POST /api/auth/refresh` to get a new one.

## Versioning

The API is currently unversioned. All paths start with `/api/`. Breaking changes in the beta period are announced in the [Changelog](../changelog.md).
