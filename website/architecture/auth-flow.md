---
title: Auth Flow
description: How Bento's authentication works — login, JWT claims, gateway validation, token refresh, and stale token invalidation.
outline: [2, 3]
---

# Auth Flow

## Login

1. Client sends `POST /api/auth/login` with email and password.
2. Auth service looks up the user by email, verifies the bcrypt hash (with the `AUTH_PEPPER` applied), and confirms `is_email_verified = true`.
3. Auth service calls org-service (`GET /internal/orgs/user/{userId}`) to get the user's organization memberships.
4. Auth service creates a signed JWT and a refresh token. The refresh token is stored in the `refresh_tokens` table.
5. Response: `{ accessToken, refreshToken, user }`.

## Token claims

Every JWT contains:

| Claim | Description |
|---|---|
| `sub` | User ID (UUID) |
| `email` | User email |
| `orgId` | Current organization ID |
| `orgRole` | Member role in the current org (`OWNER \| ADMIN \| MEMBER \| VIEWER`) |
| `orgSlug` | Organization slug |
| `iat` | Issued-at timestamp (Unix epoch seconds) |
| `exp` | Expiry timestamp |

The `orgId` and `orgRole` in the JWT are the values at the moment of login or refresh. They are trusted by downstream services via the headers the gateway forwards.

## Gateway validation

On every request to a protected route:

1. Gateway extracts the `Authorization: Bearer <token>` header.
2. Verifies the JWT signature using `JWT_SECRET`.
3. Checks expiry (`exp`).
4. Looks up `stale:{userId}:{orgId}` in Redis. If this key exists and `iat < staleTimestamp`, returns `{"error":"TOKEN_STALE"}` HTTP 401.
5. If valid, forwards the request to the downstream service with these headers added:
   - `X-Internal-Secret` (shared secret — services reject requests without it)
   - `X-User-Id`, `X-Org-Id`, `X-Org-Role`, `X-Org-Slug`

Downstream services never re-validate the JWT. They trust these headers because only the gateway can add `X-Internal-Secret`.

## Refresh

1. Client sends `POST /api/auth/refresh` with the refresh token (and optionally `currentOrgId`).
2. Auth service validates the refresh token (not expired, not revoked).
3. Auth service calls org-service to re-fetch the user's current org membership (in case role or membership changed).
4. If `currentOrgId` is provided and the user is still a member of that org, the new JWT keeps the same org context. Otherwise, the first org in the membership list is used.
5. New JWT and a new refresh token are returned. The old refresh token is revoked.

This transparent refresh means the client stays logged in as long as it has a valid refresh token, even if access tokens expire frequently.

## Stale token invalidation

The stale-token mechanism invalidates existing sessions server-side without a token blacklist.

When a member is removed from an organization or their role is changed:

1. Org-service publishes `MemberRemovedEvent` or `MemberRoleChangedEvent` (with `eventType` field) to `bento.org.events`.
2. The api-gateway's Kafka consumer (`OrgEventConsumer`) receives the event.
3. Gateway writes `stale:{userId}:{orgId}` = current epoch seconds to Redis (TTL 7 days).
4. On the next request, `JwtAuthFilter` checks Redis. If `JWT.iat < staleTimestamp`, the token is stale and a 401 is returned.
5. The client receives the 401, calls `POST /api/auth/refresh`, gets a new JWT with the correct org context (or no org context if removed).

**Why this works without explicit key deletion:** A new refresh generates a new JWT with a new `iat` greater than the stale timestamp. The stale key naturally expires after 7 days via Redis TTL.
