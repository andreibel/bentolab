---
title: Services
description: Per-service breakdown of Bento's microservices — ports, data stores, Kafka topics, and trusted headers.
outline: [2, 3]
---

# Services

## api-gateway

**Port:** 8080 | **Data stores:** Redis (stale-token keys, rate-limit counters)

The gateway is the only service exposed to the internet. It:

1. Validates the JWT on every incoming request. Requests without a valid token to protected routes are rejected with 401.
2. Checks Redis for a stale-token key (`stale:{userId}:{orgId}`). If the token's `iat` is older than the stale timestamp, returns `{"error":"TOKEN_STALE"}` with 401.
3. Extracts JWT claims and forwards them as headers: `X-User-Id`, `X-Org-Id`, `X-Org-Role`, `X-Org-Slug`.
4. Adds `X-Internal-Secret` to every proxied request. Downstream services reject requests missing this header.
5. Consumes `bento.org.events` from Kafka to populate stale-token keys when members are removed or roles change.

**Kafka topics (consumed):** `bento.org.events`

**Internal headers forwarded:**
- `X-Internal-Secret` — shared secret validating the request came from the gateway
- `X-User-Id` — authenticated user ID from JWT
- `X-Org-Id` — organization ID from JWT
- `X-Org-Role` — member role from JWT
- `X-Org-Slug` — organization slug from JWT

## auth-service

**Port:** 8081 | **Data stores:** PostgreSQL (`authdb`), Redis

Handles all identity operations:
- Register: creates user, sends `EmailVerificationRequestedEvent`
- Login: validates credentials (bcrypt + pepper), issues JWT + refresh token
- Refresh: validates refresh token, re-fetches org membership from org-service, issues new JWT
- Email verification: validates single-use token, sets `user.emailVerified = true`
- Password reset: issues single-use token (1h expiry), validates it, updates password hash, revokes all refresh tokens

**Kafka topics (produced):** `bento.user.events`
**Key events:** `UserRegisteredEvent`, `EmailVerificationRequestedEvent`, `PasswordResetRequestedEvent`

## org-service

**Port:** 8082 | **Data stores:** PostgreSQL (`orgdb`), Redis

Manages organizations, members, invitations, and roles.

- Publishes stale-token events when membership or role changes
- The gateway's `X-Org-Id` and `X-Org-Role` headers eliminate redundant DB membership checks in this service
- `InternalOrgController` exposes endpoints callable only by other services (protected by `X-Internal-Secret`)

**Kafka topics (produced):** `bento.org.events`
**Key events:** `MemberRemovedEvent`, `MemberRoleChangedEvent`, `InvitationCreatedEvent`

## board-service

**Port:** 8083 | **Data stores:** PostgreSQL (`boarddb`), Redis

Manages boards, columns, labels, board members, and board permissions.

**Kafka topics (produced):** `bento.board.events`
**Key events:** `BoardCreatedEvent`, `LabelCreatedEvent`

## task-service

**Port:** 8084 | **Data stores:** MongoDB (`task_db`), Redis

The largest service. Handles issues, sprints, comments, activity logs, dependencies, time logs, epics, milestones, and saved filters.

**Kafka topics (produced):** `bento.task.events`
**Key events:** `IssueCreatedEvent`, `IssueUpdatedEvent`, `CommentCreatedEvent`, `SprintClosedEvent`

## notification-service

**Port:** 8085 | **Data stores:** MongoDB, Redis

Consumes events from Kafka and:
- Persists in-app notifications to MongoDB
- Sends transactional email via SMTP (JavaMailSender)
- Delivers Discord webhook payloads if `DISCORD_ENABLED=true`

**Kafka topics (consumed):** `bento.user.events`, `bento.task.events`, `bento.org.events`

## realtime-service

**Port:** 8086 | **Data stores:** Redis

Maintains WebSocket/STOMP connections. Clients connect to `/ws` and subscribe to board-specific destinations. The service consumes Kafka events and pushes updates to subscribed clients.

**Kafka topics (consumed):** `bento.task.events`, `bento.board.events`

## attachment-service

**Port:** 8087 | **Data stores:** MinIO, MongoDB (attachment metadata), PostgreSQL

Handles file uploads:
1. Client requests a pre-signed upload URL.
2. Client uploads directly to MinIO.
3. Service records attachment metadata.
4. Publishes `AttachmentUploadedEvent`.

**Kafka topics (produced):** `bento.attachment.events`
