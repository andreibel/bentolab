---
title: API Conventions
description: Request headers, response envelope, pagination, timestamps, and error codes for the Bento API.
outline: [2, 3]
---

# API Conventions

## Request headers

| Header | Required | Description |
|---|---|---|
| `Authorization: Bearer <token>` | For protected routes | JWT access token |
| `Content-Type: application/json` | For POST/PATCH/PUT | Request body format |
| `Accept: application/json` | Optional | All responses are JSON |

The gateway injects internal headers (`X-User-Id`, `X-Org-Id`, `X-Org-Role`, `X-Org-Slug`, `X-Internal-Secret`) before forwarding requests to microservices. Do not set these headers manually — the gateway overwrites them.

## Response envelope

Most list endpoints return a flat JSON array. Single-resource endpoints return the resource object directly. There is no common wrapper envelope.

Example list response:

```json
[
  { "id": "abc123", "name": "Platform", ... },
  { "id": "def456", "name": "Mobile", ... }
]
```

Example resource response:

```json
{
  "id": "abc123",
  "name": "Platform",
  "type": "SCRUM",
  "createdAt": "2026-04-01T12:00:00Z"
}
```

## Pagination

List endpoints that can return large result sets support cursor-based or offset-based pagination via query parameters:

| Parameter | Type | Description |
|---|---|---|
| `page` | integer | Page number (0-indexed) |
| `size` | integer | Items per page (default varies by endpoint) |

<!-- TODO: confirm with maintainer — pagination strategy and response headers (X-Total-Count, etc.) -->

## Timestamps & timezones

All timestamps are ISO 8601 UTC strings: `"2026-04-24T10:00:00Z"`. The API does not accept timestamps in other formats. Store and display dates in the user's local timezone on the client side; send UTC to the API.

## Error codes

| Code | Meaning |
|---|---|
| `TOKEN_STALE` | JWT was invalidated server-side — call refresh |
| `TOKEN_EXPIRED` | JWT is past its `exp` — call refresh |
| `UNAUTHORIZED` | No token or invalid signature |
| `FORBIDDEN` | Valid token but insufficient role for this operation |
| `NOT_FOUND` | Resource does not exist in this org |
| `DUPLICATE_SLUG` | Org or board slug already taken |
| `EMAIL_ALREADY_EXISTS` | Registration: email in use |
| `INVALID_CREDENTIALS` | Login: wrong email or password |
| `EMAIL_NOT_VERIFIED` | Login: account exists but email not verified |
| `TOKEN_INVALID` | Verification or reset token is invalid or already used |
