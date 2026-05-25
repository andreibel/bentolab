---
title: Data Model
description: Database schema overview for Bento's PostgreSQL, MongoDB, and Redis stores.
outline: [2, 3]
---

# Data Model

Each service owns its data store. No service reads another service's database directly — cross-service data access goes through the API or Kafka events.

## Relational (Postgres)

### Auth service (`authdb`)

**User**

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | VARCHAR(255) | Unique, login identity |
| `password` | VARCHAR(255) | BCrypt hashed with pepper |
| `first_name` | VARCHAR(100) | |
| `last_name` | VARCHAR(100) | |
| `avatar_url` | VARCHAR(500) | Nullable |
| `system_role` | VARCHAR(20) | `USER` or `SUPER_ADMIN` |
| `is_active` | BOOLEAN | Account enabled |
| `is_email_verified` | BOOLEAN | Email verification status |
| `current_org_id` | UUID | Last selected org (nullable) |
| `timezone` | VARCHAR(50) | Default `UTC` |
| `locale` | VARCHAR(10) | `en`, `he`, etc. |
| `created_at`, `updated_at` | TIMESTAMP | |

**RefreshToken** — one per login session. Contains `token`, `user_id`, `expires_at`, `revoked`, `device_info`, `ip_address`.

**EmailVerificationToken** — single-use, 24-hour expiry. Contains `token`, `user_id`, `expires_at`, `used`.

**PasswordResetToken** — single-use, 1-hour expiry. Contains `token`, `user_id`, `expires_at`, `used`.

### Org service (`orgdb`)

**Organization** — `id`, `name`, `slug` (unique), `owner_id`, `logo_url`, `plan`, `settings` (JSONB), `is_active`.

**OrganizationMember** — `org_id`, `user_id`, `role` (`OWNER | ADMIN | MEMBER | VIEWER`), `joined_at`.

**OrgInvitation** — `id`, `org_id`, `email`, `role`, `token`, `expires_at`, `accepted`.

### Board service (`boarddb`)

**Board** — `id`, `org_id`, `name`, `type` (`KANBAN | SCRUM`), `created_by`.

**BoardColumn** — `id`, `board_id`, `name`, `position`, `wip_limit` (nullable).

**BoardMember** — `board_id`, `user_id`, `role`.

**Label** — `id`, `org_id`, `name`, `color`.

## Documents (MongoDB)

### Task service (`task_db`)

**Issue** — the central document. Key fields: `id`, `orgId`, `boardId`, `columnId`, `title`, `description` (Markdown), `priority`, `status`, `assigneeId`, `labelIds[]`, `epicId`, `milestoneId`, `sprintId`, `storyPoints`, `startDate`, `dueDate`, `createdBy`, `createdAt`, `updatedAt`.

**Sprint** — `id`, `boardId`, `name`, `goal`, `startDate`, `endDate`, `status` (`PLANNED | ACTIVE | CLOSED`), `velocity`.

**Comment** — `id`, `issueId`, `authorId`, `content` (Markdown), `mentions[]`, `createdAt`.

**TimeLog** — `id`, `issueId`, `userId`, `minutes`, `description`, `date`.

**Activity** — append-only log of changes. `id`, `issueId`, `userId`, `type`, `before`, `after`, `createdAt`.

**IssueRelation** — `id`, `sourceIssueId`, `targetIssueId`, `type` (`BLOCKS | RELATES_TO | DUPLICATES`).

**Epic** — `id`, `orgId`, `boardId`, `name`, `startDate`, `endDate`.

**Milestone** — `id`, `orgId`, `boardId`, `name`, `dueDate`.

### Notification service

**Notification** — `id`, `orgId`, `userId`, `type`, `referenceId`, `read`, `createdAt`.

## Cache (Redis)

Redis is used for:

| Key pattern | Content | TTL |
|---|---|---|
| `session:{token}` | User session data | Refresh token lifetime |
| `stale:{userId}:{orgId}` | Epoch seconds of last role/membership change | 7 days |
| `ratelimit:{ip}:{route}` | Request counter | 1 minute sliding window |
| Board presence | Connected user IDs per board | Session lifetime |

The stale-token key is the mechanism for server-side session invalidation without a token blacklist. When a member is removed or their role changes, org-service publishes an event; the gateway writes the current timestamp to `stale:{userId}:{orgId}`. Any JWT with an `iat` older than that timestamp is rejected.
