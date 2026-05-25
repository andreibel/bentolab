---
title: Task Service API
description: REST API reference for Bento's task-service — issues, sprints, comments, and time logs.
outline: [2, 3]
---

# Task Service API

Base path: `/api/issues`, `/api/sprints`

## IssueController

### GET /api/issues/search

Full-text search across issues in the org.

**Auth**: required  
**Roles**: any member

**Query params**: `q=<search-term>`, `boardId=<id>` (optional)

**Response** `200`: array of matching issue objects.

### GET /api/issues/mine

List all issues assigned to the authenticated user.

**Auth**: required  
**Roles**: any member

**Query params**: `status`, `priority`, `boardId`, `sprintId`

**Response** `200`: array of issue objects.

### GET /api/issues

List issues for a board, optionally filtered.

**Auth**: required  
**Roles**: board member

**Query params**: `boardId=<id>`, `columnId`, `sprintId`, `assigneeId`, `labelIds[]`

**Response** `200`: array of issue objects.

### GET /api/issues/{issueId}

Get a single issue by ID.

**Auth**: required  
**Roles**: board member

**Response** `200`: full issue object with metadata.

### POST /api/issues

Create a new issue.

**Auth**: required  
**Roles**: OWNER, ADMIN, MEMBER

**Request**:
```json
{
  "boardId": "abc123",
  "columnId": "col1",
  "title": "Fix login bug",
  "description": "## Steps to reproduce\n...",
  "priority": "HIGH",
  "assigneeId": "550e8400-...",
  "labelIds": ["label1"],
  "storyPoints": 3,
  "sprintId": null,
  "startDate": "2026-04-24",
  "dueDate": "2026-04-30"
}
```

**Response** `201`: created issue object.

### PATCH /api/issues/{issueId}

Update one or more fields on an issue.

**Auth**: required  
**Roles**: OWNER, ADMIN, MEMBER

**Request**: any subset of issue fields.

**Response** `200`: updated issue object.

### DELETE /api/issues/{issueId}

Delete an issue.

**Auth**: required  
**Roles**: OWNER, ADMIN

**Response** `204`: no body.

### PATCH /api/issues/{issueId}/move

Move an issue to a different column.

**Auth**: required  
**Roles**: OWNER, ADMIN, MEMBER

**Request**:
```json
{ "columnId": "col3", "position": 2 }
```

**Response** `200`: updated issue object.

### PATCH /api/issues/{issueId}/assign

Assign or unassign the issue.

**Auth**: required  
**Roles**: OWNER, ADMIN, MEMBER

**Request**:
```json
{ "assigneeId": "550e8400-..." }
```

**Response** `200`: updated issue object.

### POST /api/issues/{issueId}/dependencies/{depId}

Add a dependency link between two issues.

**Auth**: required  
**Roles**: OWNER, ADMIN, MEMBER

**Request**:
```json
{ "type": "BLOCKS" }
```

**Response** `201`: dependency object.

### DELETE /api/issues/{issueId}/dependencies/{depId}

Remove a dependency link.

**Auth**: required  
**Roles**: OWNER, ADMIN, MEMBER

**Response** `204`: no body.

## SprintController

### GET /api/sprints

List sprints for a board.

**Auth**: required  
**Roles**: board member

**Query params**: `boardId=<id>`, `status` (`PLANNED | ACTIVE | CLOSED`)

**Response** `200`: array of sprint objects.

### GET /api/sprints/{sprintId}

Get a sprint by ID.

**Auth**: required  
**Roles**: board member

**Response** `200`: sprint object with issues.

### POST /api/sprints

Create a sprint.

**Auth**: required  
**Roles**: OWNER, ADMIN

**Request**:
```json
{
  "boardId": "abc123",
  "name": "Sprint 14",
  "goal": "Ship the auth refactor",
  "startDate": "2026-04-28",
  "endDate": "2026-05-09"
}
```

**Response** `201`: created sprint object.

### POST /api/sprints/{sprintId}/start

Start a planned sprint.

**Auth**: required  
**Roles**: OWNER, ADMIN

**Response** `200`: updated sprint object with `status: ACTIVE`.

### POST /api/sprints/{sprintId}/complete

Close an active sprint.

**Auth**: required  
**Roles**: OWNER, ADMIN

**Request**:
```json
{
  "carryOverIssueIds": ["issue1", "issue2"],
  "targetSprintId": "sprint15"
}
```

**Response** `200`: sprint report object.

## CommentController

### GET /api/issues/{issueId}/comments

List comments on an issue.

**Auth**: required  
**Roles**: board member

**Response** `200`: array of comment objects.

### POST /api/issues/{issueId}/comments

Add a comment to an issue.

**Auth**: required  
**Roles**: OWNER, ADMIN, MEMBER

**Request**:
```json
{ "content": "Fixed in commit abc123. @bob please review." }
```

**Response** `201`: created comment object.

### PATCH /api/issues/{issueId}/comments/{commentId}

Edit a comment.

**Auth**: required  
**Roles**: comment author, OWNER, ADMIN

**Request**:
```json
{ "content": "Updated comment text" }
```

**Response** `200`: updated comment object.

### DELETE /api/issues/{issueId}/comments/{commentId}

Delete a comment.

**Auth**: required  
**Roles**: comment author, OWNER, ADMIN

**Response** `204`: no body.

## TimeLogController

### GET /api/issues/{issueId}/timelogs

List time log entries for an issue.

**Auth**: required  
**Roles**: board member

**Response** `200`: array of time log objects.

### POST /api/issues/{issueId}/timelogs

Log time on an issue.

**Auth**: required  
**Roles**: OWNER, ADMIN, MEMBER

**Request**:
```json
{
  "minutes": 150,
  "description": "Investigated root cause",
  "date": "2026-04-24"
}
```

**Response** `201`: created time log object.

### DELETE /api/issues/{issueId}/timelogs/{timeLogId}

Delete a time log entry.

**Auth**: required  
**Roles**: log author, OWNER, ADMIN

**Response** `204`: no body.
