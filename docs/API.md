# Bento — API Reference

Complete REST API documentation for all microservices. Intended as the primary guide for frontend development.

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Common Headers](#common-headers)
- [Error Format](#error-format)
- [Auth Service](#auth-service) — `/api/auth`, `/api/users`
- [Org Service](#org-service) — `/api/orgs`, `/api/members`, `/api/invitations`
- [Board Service](#board-service) — `/api/boards`
- [Task Service](#task-service) — `/api/issues`, `/api/sprints`

---

## Overview

| Service | Base URL (dev) | Purpose |
|---------|---------------|---------|
| API Gateway | `http://localhost:8080` | Single entry point — all requests go here |
| Auth | `http://localhost:8081` | Internal only |
| Org | `http://localhost:8082` | Internal only |
| Board | `http://localhost:8083` | Internal only |
| Task | `http://localhost:8084` | Internal only |

**Frontend only talks to the API Gateway on port 8080.**

---

## Authentication

### Token flow
1. `POST /api/auth/login` → receive `accessToken` + `refreshToken`
2. Include `accessToken` in every request: `Authorization: Bearer <token>`
3. When 401 is received with `{"error": "TOKEN_STALE"}` or `TOKEN_EXPIRED` → call `POST /api/auth/refresh`
4. On logout → call `POST /api/auth/logout`

### JWT payload (for reference — do not trust client-side for auth decisions)
```json
{
  "sub": "userId",
  "email": "user@example.com",
  "orgId": "uuid",
  "orgRole": "ORG_MEMBER",
  "orgSlug": "acme",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## Common Headers

### Required on all authenticated requests
```
Authorization: Bearer <accessToken>
```

### Headers injected by the gateway (do NOT send from frontend)
These are internal — the gateway strips any client-sent values and sets its own.
```
X-User-Id
X-User-Email
X-Org-Id
X-Org-Role
X-Org-Slug
X-Internal-Secret
```

---

## Error Format

All errors return the same structure:

```json
{
  "status": 404,
  "message": "Issue not found: abc123",
  "errors": [],
  "timestamp": "2026-03-09T12:00:00Z"
}
```

| Field | Description |
|-------|-------------|
| `status` | HTTP status code |
| `message` | Human-readable error message |
| `errors` | Validation field errors (populated on 400) |
| `timestamp` | ISO-8601 UTC |

### Common status codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content (successful delete) |
| 400 | Validation error — check `errors` array |
| 401 | Unauthenticated / stale token |
| 403 | Forbidden — insufficient role |
| 404 | Resource not found |
| 409 | Conflict (duplicate, active sprint exists, etc.) |
| 500 | Internal server error |

---

## Auth Service

### POST `/api/auth/register` 🔓 Public
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response `201`:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "systemRole": "USER",
    "isEmailVerified": false,
    "createdAt": "2026-03-09T12:00:00Z"
  }
}
```

---

### POST `/api/auth/login` 🔓 Public
Authenticate and receive tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response `200`:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { ... }
}
```

---

### POST `/api/auth/refresh` 🔓 Public
Get a new access token using a refresh token.

**Request:**
```json
{
  "refreshToken": "eyJ...",
  "currentOrgId": "uuid"
}
```
> `currentOrgId` is optional — pass it to keep the user in the same org after refresh. If the user was removed from that org, the token falls back to their first available org.

**Response `200`:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

### POST `/api/auth/logout` 🔐 Auth required
Revoke the current refresh token.

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response `204`:** No content.

---

### GET `/api/users/me` 🔐 Auth required
Get current user profile.

**Response `200`:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "avatarUrl": "https://...",
  "systemRole": "USER",
  "isEmailVerified": true,
  "currentOrgId": "uuid",
  "timezone": "UTC",
  "locale": "en",
  "lastLoginAt": "2026-03-09T12:00:00Z",
  "createdAt": "2026-03-09T12:00:00Z"
}
```

---

### PATCH `/api/users/me` 🔐 Auth required
Update current user profile.

**Request** (all fields optional):
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "avatarUrl": "https://...",
  "timezone": "Europe/London",
  "locale": "en"
}
```

**Response `200`:** Updated user object (same as GET `/api/users/me`).

---

### POST `/api/auth/password-reset/request` 🔓 Public
Request a password reset email.

**Request:**
```json
{ "email": "user@example.com" }
```

**Response `200`:** Always returns 200 (no email enumeration).

---

### POST `/api/auth/password-reset/confirm` 🔓 Public
Set a new password using a reset token.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "newSecret123"
}
```

**Response `200`:** Success message.

---

## Org Service

### GET `/api/orgs/me` 🔐 Auth required
List all organizations the current user belongs to.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "Acme Corp",
    "slug": "acme",
    "domain": null,
    "logoUrl": "https://...",
    "description": null,
    "plan": "FREE",
    "settings": {},
    "ownerId": "uuid",
    "isActive": true,
    "isDefault": true,
    "setupCompleted": true,
    "createdAt": "2026-03-09T12:00:00Z",
    "updatedAt": "2026-03-09T12:00:00Z"
  }
]
```

---

### POST `/api/orgs` 🔐 Auth required
Create a new organization.

**Request:**
```json
{
  "name": "Acme Corp",
  "slug": "acme",
  "description": "Optional description",
  "logoUrl": "https://..."
}
```

**Response `201`:** Organization object.

---

### GET `/api/orgs/{orgId}` 🔐 Org member
Get organization details.

**Response `200`:**
```json
{
  "id": "uuid",
  "name": "Acme Corp",
  "slug": "acme",
  "domain": null,
  "logoUrl": "https://...",
  "description": "...",
  "plan": "FREE",
  "settings": {
    "maxUsers": 10,
    "maxBoards": 5,
    "maxStorageGB": 5,
    "allowDiscord": true,
    "allowExport": true,
    "customBranding": false,
    "ssoEnabled": false
  },
  "ownerId": "uuid",
  "isActive": true,
  "setupCompleted": true,
  "createdAt": "2026-03-09T12:00:00Z"
}
```

---

### PATCH `/api/orgs/{orgId}` 🔐 ORG_OWNER
Update organization settings.

**Request** (all fields optional):
```json
{
  "name": "Acme Corp",
  "description": "...",
  "logoUrl": "https://..."
}
```

**Response `200`:** Updated organization object.

---

### DELETE `/api/orgs/{orgId}` 🔐 ORG_OWNER
Delete organization.

**Response `204`:** No content.

---

### PATCH `/api/orgs/{orgId}/settings` 🔐 ORG_OWNER
Update organization plan settings (limits, features).

**Request** (all fields optional):
```json
{
  "maxUsers": 25,
  "maxBoards": 10,
  "maxStorageGB": 20,
  "allowDiscord": true,
  "allowExport": true,
  "customBranding": false,
  "ssoEnabled": false
}
```

**Response `200`:** Updated organization object.

---

### POST `/api/orgs/{orgId}/transfer` 🔐 ORG_OWNER
Transfer ownership of the organization to another member.

**Request:**
```json
{ "newOwnerId": "uuid" }
```

**Response `204`:** No content.

---

### POST `/api/auth/switch-org` 🔐 Auth required
Switch the current user's active organization context. Issues a new JWT with the selected org embedded.

**Request:**
```json
{ "orgId": "uuid" }
```

**Response `200`:** New access token with updated `orgId` in JWT.
```json
{ "accessToken": "eyJ..." }
```

---

### GET `/api/orgs/{orgId}/members` 🔐 Org member
List all members of the org.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "orgRole": "ORG_MEMBER",
    "joinedAt": "2026-03-09T12:00:00Z"
  }
]
```

---

### PATCH `/api/orgs/{orgId}/members/{userId}/role` 🔐 ORG_ADMIN
Change a member's role.

**Request:**
```json
{ "orgRole": "ORG_ADMIN" }
```
> Valid values: `ORG_ADMIN`, `ORG_MEMBER`

**Response `200`:** Updated member object.

---

### DELETE `/api/orgs/{orgId}/members/{userId}` 🔐 ORG_ADMIN or self
Remove a member from the org (or leave the org yourself).

**Response `204`:** No content.

---

### POST `/api/orgs/{orgId}/invitations` 🔐 ORG_ADMIN
Invite a user to the org by email.

**Request:**
```json
{
  "email": "newuser@example.com",
  "orgRole": "ORG_MEMBER",
  "message": "Welcome to the team!"
}
```

**Response `201`:** Invitation object.

---

### GET `/api/orgs/{orgId}/invitations` 🔐 ORG_ADMIN
List invitations for the org.

**Query params:** `status` (optional) — filter by invitation status.

**Response `200`:** Array of invitation objects.

---

### POST `/api/invitations/{token}/accept` 🔐 Auth required
Accept an org invitation. The token comes from the invitation email link.

> The user must be authenticated (JWT required). The `X-User-Email` header is used to verify the invitee's identity.

**Response `200`:** Member object (user is now a member of the org).

---

### DELETE `/api/orgs/{orgId}/invitations/{invitationId}` 🔐 ORG_ADMIN
Revoke a pending invitation.

**Response `204`:** No content.

---

## Board Service

### GET `/api/boards` 🔐 Org member
List all boards in the current org.
- Org members see boards they are a member of.
- ORG_ADMIN / ORG_OWNER see all boards.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "orgId": "uuid",
    "name": "Team Frontend",
    "description": "...",
    "boardKey": "TF",
    "boardType": "SCRUM",
    "background": "#FF5733",
    "ownerId": "uuid",
    "isArchived": false,
    "issueCounter": 42,
    "createdAt": "2026-03-09T12:00:00Z",
    "updatedAt": "2026-03-09T12:00:00Z"
  }
]
```

---

### POST `/api/boards` 🔐 Org member
Create a new board. Default columns are created automatically based on `boardType`.

**Request:**
```json
{
  "name": "Team Frontend",
  "description": "Optional",
  "boardKey": "TF",
  "boardType": "SCRUM",
  "background": "#FF5733"
}
```
> `boardType` values: `SCRUM`, `KANBAN`, `BUG_TRACKING`, `CUSTOM`
>
> Default columns per type:
> - `SCRUM` → To Do, In Progress, In Review, Done
> - `KANBAN` → Backlog, In Progress, Done
> - `BUG_TRACKING` → Open, In Progress, In Review, Resolved
> - `CUSTOM` → To Do, Done

**Response `201`:**
```json
{
  "id": "uuid",
  "name": "Team Frontend",
  "boardKey": "TF",
  "boardType": "SCRUM",
  "columns": [
    {
      "id": "uuid",
      "name": "To Do",
      "position": 0,
      "isInitial": true,
      "isFinal": false
    },
    {
      "id": "uuid",
      "name": "Done",
      "position": 3,
      "isInitial": false,
      "isFinal": true
    }
  ],
  "createdAt": "2026-03-09T12:00:00Z"
}
```

---

### GET `/api/boards/{boardId}` 🔐 Board member or ORG_ADMIN
Get board details including columns.

**Response `200`:** Full board object with `columns` array (same shape as POST response).

---

### PATCH `/api/boards/{boardId}` 🔐 Board PRODUCT_OWNER or ORG_ADMIN
Update board settings.

**Request** (all fields optional):
```json
{
  "name": "Team Frontend",
  "description": "...",
  "background": "#0000FF"
}
```

**Response `200`:** Updated board object.

---

### DELETE `/api/boards/{boardId}` 🔐 Board PRODUCT_OWNER or ORG_OWNER
Delete a board. Publishes `BoardDeletedEvent` → task-service will delete all associated issues/sprints.

**Response `204`:** No content.

---

### PATCH `/api/boards/{boardId}/archive` 🔐 Board PRODUCT_OWNER or ORG_ADMIN
Toggle archive status of a board.

**Response `200`:** Updated board object with new `isArchived` value.

---

### GET `/api/boards/{boardId}/columns` 🔐 Board member or ORG_ADMIN
List all columns for a board (ordered by position).

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "boardId": "uuid",
    "name": "To Do",
    "position": 0,
    "color": "#CCCCCC",
    "wipLimit": null,
    "isInitial": true,
    "isFinal": false,
    "createdAt": "2026-03-09T12:00:00Z"
  }
]
```

---

### POST `/api/boards/{boardId}/columns` 🔐 Board PRODUCT_OWNER or ORG_ADMIN
Create a new column.

**Request:**
```json
{
  "name": "Testing",
  "position": 2,
  "color": "#AABBCC",
  "wipLimit": 5,
  "isInitial": false,
  "isFinal": false
}
```

**Response `201`:** Column object.

---

### PATCH `/api/boards/{boardId}/columns/{columnId}` 🔐 Board PRODUCT_OWNER or ORG_ADMIN
Update a column.

**Request** (all fields optional):
```json
{
  "name": "QA",
  "color": "#FF0000",
  "wipLimit": 3,
  "isInitial": false,
  "isFinal": false
}
```

**Response `200`:** Updated column object.

---

### DELETE `/api/boards/{boardId}/columns/{columnId}` 🔐 Board PRODUCT_OWNER or ORG_ADMIN
Delete a column. Publishes `BoardColumnDeletedEvent` → task-service moves orphaned issues to the initial column.

**Response `204`:** No content.

---

### PATCH `/api/boards/{boardId}/columns/reorder` 🔐 Board PRODUCT_OWNER or ORG_ADMIN
Reorder all columns.

**Request:**
```json
{
  "columnIds": ["uuid1", "uuid2", "uuid3"]
}
```
> Send all column IDs in the desired order. Positions are reassigned 0, 1, 2...

**Response `200`:** Updated list of columns.

---

### GET `/api/boards/{boardId}/members` 🔐 Board member or ORG_ADMIN
List all board members.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "boardId": "uuid",
    "userId": "uuid",
    "boardRole": "DEVELOPER",
    "joinedAt": "2026-03-09T12:00:00Z",
    "addedBy": "uuid"
  }
]
```

---

### POST `/api/boards/{boardId}/members` 🔐 Board PRODUCT_OWNER or ORG_ADMIN
Add a member to the board.

**Request:**
```json
{
  "userId": "uuid",
  "boardRole": "DEVELOPER"
}
```
> `boardRole` values: `PRODUCT_OWNER`, `SCRUM_MASTER`, `DEVELOPER`, `VIEWER`

**Response `201`:** Board member object.

---

### PATCH `/api/boards/{boardId}/members/{userId}` 🔐 Board PRODUCT_OWNER or ORG_ADMIN
Change a member's board role.

**Request:**
```json
{ "boardRole": "SCRUM_MASTER" }
```

**Response `200`:** Updated member object.

---

### DELETE `/api/boards/{boardId}/members/{userId}` 🔐 Board PRODUCT_OWNER, ORG_ADMIN, or self
Remove a member from the board. Users can remove themselves (leave).

**Response `204`:** No content.

---

### GET `/api/boards/{boardId}/labels` 🔐 Board member or ORG_ADMIN
List all labels for this board.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "orgId": "uuid",
    "boardId": "uuid",
    "name": "bug",
    "color": "#FF0000",
    "description": "Something broken",
    "createdAt": "2026-03-09T12:00:00Z"
  }
]
```

---

### POST `/api/boards/{boardId}/labels` 🔐 Board member or ORG_ADMIN
Create a label.

**Request:**
```json
{
  "name": "bug",
  "color": "#FF0000",
  "description": "Something broken"
}
```

**Response `201`:** Label object.

---

### PATCH `/api/boards/{boardId}/labels/{labelId}` 🔐 Board member or ORG_ADMIN
Update a label.

**Request** (all fields optional):
```json
{
  "name": "critical-bug",
  "color": "#CC0000",
  "description": "Very broken"
}
```

**Response `200`:** Updated label object.

---

### DELETE `/api/boards/{boardId}/labels/{labelId}` 🔐 Board PRODUCT_OWNER or ORG_ADMIN
Delete a label.

**Response `204`:** No content.

---

## Task Service

> **Note:** There is no `status` field on issues. The column an issue is in (`columnId`) is the source of truth for its status. Use the board's column list to map `columnId` → column name/status.

---

### GET `/api/issues` 🔐 Org member
List issues for a board with pagination.

**Query params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `boardId` | string | ✅ | Filter by board |
| `page` | int | — | Page number (default 0) |
| `size` | int | — | Page size (default 50) |
| `sort` | string | — | e.g. `createdAt,desc` |

**Response `200`:**
```json
{
  "content": [ { ...issue } ],
  "totalElements": 100,
  "totalPages": 2,
  "size": 50,
  "number": 0
}
```

---

### GET `/api/issues/{issueId}` 🔐 Org member
Get full issue details.

**Response `200`:**
```json
{
  "id": "mongoId",
  "orgId": "uuid",
  "boardId": "uuid",
  "issueKey": "TF-42",
  "type": "STORY",
  "priority": "HIGH",
  "severity": null,
  "title": "Implement login page",
  "description": "Markdown content...",
  "columnId": "uuid",
  "position": 2,
  "reporterId": "uuid",
  "assigneeId": "uuid",
  "watcherIds": [],
  "startDate": null,
  "dueDate": "2026-03-15T00:00:00Z",
  "completedAt": null,
  "resolvedAt": null,
  "estimatedHours": 8.0,
  "totalTimeSpent": 3.5,
  "remainingHours": 4.5,
  "storyPoints": 5,
  "sprintId": "mongoId",
  "epicId": null,
  "parentIssueId": null,
  "labelIds": ["mongoId"],
  "components": ["auth"],
  "checklist": [
    {
      "id": "cid1",
      "text": "Write unit tests",
      "checked": false,
      "assigneeId": null,
      "position": 0
    }
  ],
  "columnHistory": [
    {
      "columnId": "uuid",
      "columnName": "To Do",
      "enteredAt": "2026-03-01T10:00:00Z",
      "exitedAt": "2026-03-05T14:00:00Z",
      "duration": 363600000
    }
  ],
  "reassignmentCount": 1,
  "commentCount": 3,
  "statusChangeCount": 2,
  "createdBy": "uuid",
  "createdAt": "2026-03-01T10:00:00Z",
  "updatedAt": "2026-03-09T12:00:00Z"
}
```

**Enums:**
- `type`: `EPIC`, `STORY`, `TASK`, `BUG`, `SUBTASK`
- `priority`: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`
- `severity` (bugs only): `BLOCKER`, `CRITICAL`, `MAJOR`, `MINOR`, `TRIVIAL`

---

### POST `/api/issues` 🔐 Org member
Create a new issue.

**Request:**
```json
{
  "boardId": "uuid",
  "boardKey": "TF",
  "type": "TASK",
  "priority": "MEDIUM",
  "severity": null,
  "title": "Fix navbar alignment",
  "description": "The navbar is misaligned on mobile.",
  "columnId": "uuid",
  "assigneeId": "uuid",
  "sprintId": "mongoId",
  "epicId": null,
  "parentIssueId": null,
  "storyPoints": 2,
  "estimatedHours": 4.0,
  "startDate": null,
  "dueDate": "2026-03-15T00:00:00Z",
  "labelIds": ["mongoId"],
  "components": ["ui"]
}
```
> `boardKey` must match the board's key exactly — used to generate `issueKey` (e.g. `TF-43`). Get it from the board object.

**Response `201`:** Full issue object.

---

### PATCH `/api/issues/{issueId}` 🔐 Reporter, assignee, or ORG_ADMIN
Update issue fields. All fields are optional — only send what changes.

**Request:**
```json
{
  "title": "Fix navbar on mobile",
  "priority": "HIGH",
  "storyPoints": 3,
  "dueDate": "2026-03-20T00:00:00Z",
  "labelIds": ["mongoId1", "mongoId2"]
}
```

**Response `200`:** Updated issue object.

---

### DELETE `/api/issues/{issueId}` 🔐 Reporter or ORG_ADMIN
Delete an issue permanently.

**Response `204`:** No content.

---

### PATCH `/api/issues/{issueId}/move` 🔐 Org member
Move an issue to a different column (drag & drop). Updates column history automatically.

**Request:**
```json
{
  "columnId": "uuid",
  "position": 1
}
```

**Response `200`:** Updated issue object.

---

### PATCH `/api/issues/{issueId}/assign` 🔐 Org member
Assign or unassign an issue.

**Request:**
```json
{ "assigneeId": "uuid" }
```
> Pass `assigneeId: null` to unassign.

**Response `200`:** Updated issue object.

---

### GET `/api/issues/{issueId}/comments` 🔐 Org member
List comments on an issue (paginated, excludes soft-deleted).

**Query params:** `page`, `size`, `sort`

**Response `200`:**
```json
{
  "content": [
    {
      "id": "mongoId",
      "issueId": "mongoId",
      "userId": "uuid",
      "text": "Markdown content...",
      "mentionedUserIds": ["uuid"],
      "isEdited": false,
      "createdAt": "2026-03-09T12:00:00Z",
      "updatedAt": "2026-03-09T12:00:00Z"
    }
  ],
  "totalElements": 3,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

---

### POST `/api/issues/{issueId}/comments` 🔐 Org member
Add a comment.

**Request:**
```json
{
  "text": "Looks good to me! @John",
  "mentionedUserIds": ["uuid"]
}
```

**Response `201`:** Comment object.

---

### PATCH `/api/issues/{issueId}/comments/{commentId}` 🔐 Comment author or ORG_ADMIN
Edit a comment. Sets `isEdited: true`.

**Request:**
```json
{
  "text": "Updated text",
  "mentionedUserIds": []
}
```

**Response `200`:** Updated comment object.

---

### DELETE `/api/issues/{issueId}/comments/{commentId}` 🔐 Comment author or ORG_ADMIN
Soft-delete a comment (`isDeleted: true`). The comment is hidden from list responses.

**Response `204`:** No content.

---

### GET `/api/issues/{issueId}/timelogs` 🔐 Org member
List all time logs for an issue.

**Response `200`:**
```json
[
  {
    "id": "mongoId",
    "issueId": "mongoId",
    "userId": "uuid",
    "hoursSpent": 2.5,
    "date": "2026-03-09T00:00:00Z",
    "description": "Working on authentication flow",
    "createdAt": "2026-03-09T12:00:00Z"
  }
]
```

---

### POST `/api/issues/{issueId}/timelogs` 🔐 Org member
Log time on an issue. Automatically adds to `totalTimeSpent` on the issue.

**Request:**
```json
{
  "hoursSpent": 2.5,
  "date": "2026-03-09T00:00:00Z",
  "description": "Implemented OAuth flow"
}
```

**Response `201`:** Time log object.

---

### DELETE `/api/issues/{issueId}/timelogs/{timeLogId}` 🔐 Org member
Delete a time log. Automatically subtracts from `totalTimeSpent` on the issue.

**Response `204`:** No content.

---

### GET `/api/issues/{issueId}/relations` 🔐 Org member
List all relations for an issue (both as source and target).

**Response `200`:**
```json
[
  {
    "id": "mongoId",
    "sourceIssueId": "mongoId",
    "targetIssueId": "mongoId",
    "relationType": "BLOCKS",
    "createdBy": "uuid",
    "createdAt": "2026-03-09T12:00:00Z"
  }
]
```

> `relationType` values: `BLOCKS`, `BLOCKED_BY`, `RELATES_TO`, `DUPLICATES`, `DUPLICATED_BY`, `CLONES`, `CLONED_BY`

---

### POST `/api/issues/{issueId}/relations` 🔐 Org member
Add a relation between two issues.

**Request:**
```json
{
  "targetIssueId": "mongoId",
  "relationType": "BLOCKS"
}
```

**Response `201`:** Relation object. Returns `409` if relation already exists.

---

### DELETE `/api/issues/{issueId}/relations/{relationId}` 🔐 Org member
Remove a relation.

**Response `204`:** No content.

---

### GET `/api/issues/{issueId}/activities` 🔐 Org member
Get the activity log for a specific issue (paginated).

**Query params:** `page`, `size`

**Response `200`:**
```json
{
  "content": [
    {
      "id": "mongoId",
      "userId": "uuid",
      "entityType": "ISSUE",
      "action": "COLUMN_CHANGED",
      "details": {
        "field": "columnId",
        "oldValue": "uuid1",
        "newValue": "uuid2",
        "metadata": null
      },
      "createdAt": "2026-03-09T12:00:00Z"
    }
  ],
  "totalElements": 10,
  "totalPages": 1
}
```

> `action` values: `CREATED`, `UPDATED`, `DELETED`, `COLUMN_CHANGED`, `ASSIGNED`, `COMMENTED`, `SPRINT_CHANGED`

---

### GET `/api/issues/activities?boardId=` 🔐 Org member
Get the activity log for an entire board (paginated).

**Query params:** `boardId` (required), `page`, `size`

**Response `200`:** Same paginated structure as issue activities.

---

### GET `/api/issues/filters?boardId=` 🔐 Org member
List saved filters for a board. Returns own filters + any shared filters from other members.

**Query params:** `boardId` (required)

**Response `200`:**
```json
[
  {
    "id": "mongoId",
    "boardId": "uuid",
    "userId": "uuid",
    "name": "My Bugs",
    "isShared": false,
    "filters": {
      "types": ["BUG"],
      "columnIds": ["uuid1", "uuid2"],
      "priorities": ["HIGH", "CRITICAL"],
      "assigneeIds": ["uuid"],
      "labelIds": [],
      "sprintId": null,
      "dueDateFrom": null,
      "dueDateTo": null,
      "searchText": null
    },
    "createdAt": "2026-03-09T12:00:00Z"
  }
]
```

---

### POST `/api/issues/filters` 🔐 Org member
Save a filter for quick access.

**Request:**
```json
{
  "boardId": "uuid",
  "name": "My Bugs",
  "isShared": false,
  "filters": {
    "types": ["BUG"],
    "priorities": ["CRITICAL", "HIGH"],
    "assigneeIds": ["uuid"],
    "columnIds": [],
    "labelIds": [],
    "sprintId": null,
    "dueDateFrom": null,
    "dueDateTo": null,
    "searchText": null
  }
}
```

**Response `201`:** Saved filter object.

---

### DELETE `/api/issues/filters/{filterId}` 🔐 Filter owner or ORG_ADMIN
Delete a saved filter.

**Response `204`:** No content.

---

### GET `/api/sprints?boardId=` 🔐 Org member
List all sprints for a board.

**Response `200`:**
```json
[
  {
    "id": "mongoId",
    "orgId": "uuid",
    "boardId": "uuid",
    "name": "Sprint 1",
    "goal": "Ship the auth flow",
    "status": "ACTIVE",
    "startDate": "2026-03-01T00:00:00Z",
    "endDate": "2026-03-14T00:00:00Z",
    "duration": 14,
    "totalPoints": 30,
    "completedPoints": 18,
    "totalIssues": 10,
    "completedIssues": 6,
    "velocity": 18.0,
    "scopeChanges": { "addedCount": 2, "removedCount": 1 },
    "retrospective": null,
    "createdBy": "uuid",
    "createdAt": "2026-03-01T00:00:00Z",
    "completedAt": null
  }
]
```

> `status` values: `PLANNED`, `ACTIVE`, `COMPLETED`

---

### GET `/api/sprints/{sprintId}` 🔐 Org member
Get sprint details.

**Response `200`:** Sprint object (same shape as list item).

---

### POST `/api/sprints` 🔐 ORG_ADMIN or ORG_OWNER
Create a new sprint.

**Request:**
```json
{
  "boardId": "uuid",
  "name": "Sprint 2",
  "goal": "Complete the board view",
  "startDate": "2026-03-15T00:00:00Z",
  "endDate": "2026-03-28T00:00:00Z",
  "duration": 14
}
```

**Response `201`:** Sprint object with `status: PLANNED`.

---

### PATCH `/api/sprints/{sprintId}` 🔐 ORG_ADMIN or ORG_OWNER
Update sprint details (only while `PLANNED`).

**Request** (all fields optional):
```json
{
  "name": "Sprint 2 - revised",
  "goal": "Updated goal",
  "startDate": "2026-03-16T00:00:00Z",
  "endDate": "2026-03-29T00:00:00Z"
}
```

**Response `200`:** Updated sprint object.

---

### POST `/api/sprints/{sprintId}/start` 🔐 ORG_ADMIN or ORG_OWNER
Start a sprint. Returns `409` if another sprint is already active on the same board.

**Response `200`:** Sprint object with `status: ACTIVE`.

---

### POST `/api/sprints/{sprintId}/complete` 🔐 ORG_ADMIN or ORG_OWNER
Complete a sprint. Incomplete issues are moved to backlog or another sprint.

**Request:**
```json
{
  "moveIncompleteToSprintId": "mongoId",
  "retrospective": {
    "whatWentWell": ["Good team collaboration", "All PRs reviewed same day"],
    "whatWentWrong": ["Scope creep mid-sprint"],
    "actionItems": ["Set stricter scope rules next sprint"]
  }
}
```
> `moveIncompleteToSprintId: null` moves incomplete issues to the backlog (no sprint).

**Response `200`:** Sprint object with `status: COMPLETED` and `completedAt` set.

---

## Pagination

Endpoints that return lists use Spring's standard pageable format.

**Query params:**
```
?page=0&size=20&sort=createdAt,desc
```

**Response envelope:**
```json
{
  "content": [...],
  "totalElements": 100,
  "totalPages": 5,
  "size": 20,
  "number": 0,
  "first": true,
  "last": false,
  "empty": false
}
```

---

## Role Reference

### Org roles (from JWT `orgRole`)

| Role | Level | Can do |
|------|-------|--------|
| `ORG_MEMBER` | 0 | View/participate in boards they're a member of |
| `ORG_ADMIN` | 1 | Everything ORG_MEMBER + manage members, sprints |
| `ORG_OWNER` | 2 | Everything + delete org, transfer ownership |

### Board roles

| Role | Can do |
|------|--------|
| `VIEWER` | Read-only access to the board |
| `DEVELOPER` | Create/move issues, log time, comment |
| `SCRUM_MASTER` | Developer + manage columns |
| `PRODUCT_OWNER` | Full control over the board |

> ORG_ADMIN and ORG_OWNER bypass all board-level role checks.
