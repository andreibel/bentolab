---
title: Notification Service API
description: REST API reference for Bento's notification-service — in-app notifications and the SSE stream.
outline: [2, 3]
---

# Notification Service API

Base path: `/api/notifications`

## NotificationController

### GET /api/notifications

List notifications for the authenticated user.

**Auth**: required  
**Roles**: any member

**Query params**: `read=true|false` (optional filter), `page`, `size`

**Response** `200`:
```json
[
  {
    "id": "notif1",
    "type": "MENTION",
    "read": false,
    "referenceId": "acme-42",
    "createdAt": "2026-04-24T10:00:00Z"
  }
]
```

### GET /api/notifications/unread-count

Get the count of unread notifications for the badge.

**Auth**: required  
**Roles**: any member

**Response** `200`:
```json
{ "count": 4 }
```

### PATCH /api/notifications/{id}/read

Mark a single notification as read.

**Auth**: required  
**Roles**: notification owner

**Response** `200`: updated notification object.

### PATCH /api/notifications/read-all

Mark all notifications as read.

**Auth**: required  
**Roles**: any member

**Response** `204`: no body.

### GET /api/notifications/stream

Server-Sent Events (SSE) stream for real-time notification delivery.

**Auth**: required  
**Roles**: any member

**Produces**: `text/event-stream`

The client subscribes to this endpoint to receive new notifications as SSE events. Each event has `data: <json>` with the notification payload. The stream stays open until the client closes it.

::: info SSE vs WebSocket
This endpoint uses SSE (one-way push from server) rather than the STOMP WebSocket used for board updates. The frontend maintains both connections simultaneously.
:::
