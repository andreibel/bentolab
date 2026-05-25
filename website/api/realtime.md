---
title: Realtime Service API
description: WebSocket/STOMP API reference for Bento's realtime-service — presence and board events.
outline: [2, 3]
---

# Realtime Service API

The realtime service uses WebSocket/STOMP rather than REST. Clients connect to `/ws` and exchange STOMP frames.

## Connection

Connect to the STOMP WebSocket endpoint:

```
ws://localhost:8086/ws
```

or, via the API gateway reverse proxy:

```
ws://localhost:8080/ws
```

On connect, authenticate by sending the JWT in the STOMP `CONNECT` frame headers:

```
CONNECT
Authorization:Bearer <access_token>
```

## PresenceController

### STOMP send: /app/presence/board/{boardId}/join

Announce that the current user is viewing a board.

**Auth**: required (via STOMP principal)

**Payload**:
```json
{
  "displayName": "Alice Smith",
  "avatarUrl": "https://..."
}
```

The service uses the authenticated user ID from the STOMP session — the `userId` in the payload is ignored for security. Only `displayName` and `avatarUrl` are taken from the payload.

### STOMP send: /app/presence/board/{boardId}/leave

Announce that the current user is leaving a board view.

**Auth**: required

**Payload**: empty

### STOMP subscribe: /topic/board/{boardId}/presence

Receive presence updates for a board.

**Message payload**:
```json
[
  { "userId": "550e8400-...", "displayName": "Alice Smith", "avatarUrl": null },
  { "userId": "6ba7b810-...", "displayName": "Bob Jones", "avatarUrl": "https://..." }
]
```

A new presence list is broadcast whenever any user joins or leaves the board. The list contains all currently-present users.

### STOMP subscribe: /topic/board/{boardId}

Receive board events (issue moves, creates, updates, deletes) for a board.

**Message payload**: JSON event object. The shape depends on the event type:

```json
{
  "type": "ISSUE_MOVED",
  "issueId": "acme-42",
  "columnId": "col3",
  "position": 2,
  "movedBy": "550e8400-..."
}
```

::: info Event types
The full list of board event types is `ISSUE_CREATED`, `ISSUE_UPDATED`, `ISSUE_DELETED`, `ISSUE_MOVED`, `COLUMN_CREATED`, `COLUMN_UPDATED`, `COLUMN_DELETED`. <!-- TODO: confirm with maintainer — complete event type list -->
:::

### Session disconnect

When a WebSocket session disconnects (tab closed, network loss, explicit leave), the realtime service automatically removes the user from all board presence sets and broadcasts an updated presence list to remaining subscribers.
