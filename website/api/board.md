---
title: Board Service API
description: REST API reference for Bento's board-service — boards, columns, labels, and board members.
outline: [2, 3]
---

# Board Service API

Base path: `/api/boards`, `/api/labels`

## BoardController

### GET /api/boards

List all boards the authenticated user has access to in the current org.

**Auth**: required  
**Roles**: any member

**Response** `200`: array of board objects.

### POST /api/boards

Create a new board.

**Auth**: required  
**Roles**: OWNER, ADMIN

**Request**:
```json
{
  "name": "Platform",
  "type": "SCRUM"
}
```

**Response** `201`: created board object.

### GET /api/boards/{boardId}

Get a board by ID including its columns and members.

**Auth**: required  
**Roles**: board member

**Response** `200`:
```json
{
  "id": "abc123",
  "name": "Platform",
  "type": "SCRUM",
  "columns": [
    { "id": "col1", "name": "Backlog", "position": 0, "wipLimit": null }
  ]
}
```

### PATCH /api/boards/{boardId}

Update board name or type.

**Auth**: required  
**Roles**: OWNER, ADMIN

**Request**:
```json
{ "name": "Platform V2" }
```

**Response** `200`: updated board object.

### DELETE /api/boards/{boardId}

Delete a board and all its issues.

**Auth**: required  
**Roles**: OWNER, ADMIN

**Response** `204`: no body.

## BoardColumnController

### GET /api/boards/{boardId}/columns

List all columns for a board.

**Auth**: required  
**Roles**: board member

**Response** `200`: ordered array of column objects.

### POST /api/boards/{boardId}/columns

Add a column to a board.

**Auth**: required  
**Roles**: OWNER, ADMIN

**Request**:
```json
{ "name": "QA", "wipLimit": 3 }
```

**Response** `201`: created column object.

### PATCH /api/boards/{boardId}/columns/{columnId}

Rename a column or update its WIP limit.

**Auth**: required  
**Roles**: OWNER, ADMIN

**Request**:
```json
{ "name": "In Review", "wipLimit": 5 }
```

**Response** `200`: updated column object.

### DELETE /api/boards/{boardId}/columns/{columnId}

Delete a column. Issues in the column are moved to the first column.

**Auth**: required  
**Roles**: OWNER, ADMIN

**Response** `204`: no body.

### PATCH /api/boards/{boardId}/columns/reorder

Reorder columns.

**Auth**: required  
**Roles**: OWNER, ADMIN

**Request**:
```json
{ "columnIds": ["col3", "col1", "col2", "col4"] }
```

**Response** `200`: updated ordered column array.

## LabelController

### GET /api/labels

List all labels for the current organization.

**Auth**: required  
**Roles**: any member

**Response** `200`: array of label objects.

### POST /api/labels

Create a label.

**Auth**: required  
**Roles**: OWNER, ADMIN, MEMBER

**Request**:
```json
{ "name": "bug", "color": "#ef4444" }
```

**Response** `201`: created label object.

### PATCH /api/labels/{labelId}

Update a label's name or color.

**Auth**: required  
**Roles**: OWNER, ADMIN, MEMBER

**Request**:
```json
{ "color": "#f59e0b" }
```

**Response** `200`: updated label object.

### DELETE /api/labels/{labelId}

Delete a label. The label is removed from all issues.

**Auth**: required  
**Roles**: OWNER, ADMIN, MEMBER

**Response** `204`: no body.
