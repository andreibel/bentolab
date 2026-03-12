# Real-time Service — Backend Requirements & UI Contract

## Overview

A dedicated real-time service bridges Kafka events (from all microservices) to connected browser clients via WebSocket. This enables live board updates, presence indicators, and collaborative features without polling — getting Bento as close to Google Docs-style collaboration as possible without changing the core REST backend.

---

## Architecture

```
Browser (WebSocket)
     ↕  STOMP over WS
realtime-service (port 8086)
     ↕  Kafka Consumer
bento.*.events  ←  all microservices
```

**Why a separate service?**
- Keeps microservices stateless and decoupled
- WebSocket connections are long-lived and stateful — isolating this avoids scaling conflicts with REST services
- Can scale horizontally (sticky sessions or Redis Pub/Sub for cross-instance fan-out)

**Technology stack (recommended):**
- Spring Boot 4.0 + Spring WebSocket (STOMP)
- `spring-boot-starter-websocket`
- Redis Pub/Sub for cross-instance fan-out (when running multiple instances)
- Kafka Consumer for all `bento.*.events` topics

---

## WebSocket Connection Contract

### Endpoint

```
ws://localhost:8086/ws
```

(via api-gateway proxy: `ws://localhost:8080/ws`)

### Handshake Authentication

On connect, the client sends the JWT as a query parameter or STOMP `CONNECT` header:

```
STOMP CONNECT
Authorization: Bearer <accessToken>
```

The service validates the token (same logic as api-gateway), extracts `userId` and `orgId`, and registers the connection in Redis:

```
Key:   presence:{orgId}:{userId}
Value: { connectionId, boardId | null, connectedAt, lastSeenAt }
TTL:   30 seconds (refreshed by heartbeat)
```

---

## STOMP Topics (Server → Client)

All topic paths are namespaced by org to prevent cross-tenant leakage.

### 1. Board updates

```
/topic/org/{orgId}/board/{boardId}/issues
```

**Payload — `IssueUpdatedEvent`:**
```json
{
  "eventType": "ISSUE_CREATED | ISSUE_UPDATED | ISSUE_MOVED | ISSUE_DELETED",
  "issue": { ...full Issue object... },
  "changedFields": ["title", "columnId", "assigneeId"],
  "actorId": "string"
}
```

**UI uses this to:** invalidate or patch the React Query cache for `issues.list(boardId)` and `issues.detail(issueId)` without polling.

---

### 2. Backlog / Sprint updates

```
/topic/org/{orgId}/board/{boardId}/sprints
```

**Payload — `SprintUpdatedEvent`:**
```json
{
  "eventType": "SPRINT_CREATED | SPRINT_UPDATED | SPRINT_STARTED | SPRINT_COMPLETED",
  "sprint": { ...Sprint object... },
  "actorId": "string"
}
```

---

### 3. Epic updates

```
/topic/org/{orgId}/board/{boardId}/epics
```

**Payload — `EpicUpdatedEvent`:**
```json
{
  "eventType": "EPIC_CREATED | EPIC_UPDATED | EPIC_DELETED",
  "epic": { ...Epic object... },
  "actorId": "string"
}
```

---

### 4. Presence — who is online

```
/topic/org/{orgId}/board/{boardId}/presence
```

**Payload — `PresenceEvent`:**
```json
{
  "eventType": "JOINED | LEFT | HEARTBEAT",
  "user": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "avatarUrl": "string | null"
  },
  "boardId": "string"
}
```

**UI uses this to:** show live "online now" avatars at the top of the board header. Initial list fetched via REST, then kept up to date via this topic.

---

### 5. Issue-level presence (viewing / editing)

```
/topic/org/{orgId}/issue/{issueId}/presence
```

**Payload:**
```json
{
  "eventType": "VIEWING | EDITING | LEFT",
  "user": { "id": "string", "firstName": "string", "lastName": "string", "avatarUrl": "string | null" }
}
```

**UI uses this to:** show "Alice is editing this issue" in `IssueDetailPanel`.

---

### 6. Comment activity (live feed)

```
/topic/org/{orgId}/issue/{issueId}/comments
```

**Payload:**
```json
{
  "eventType": "COMMENT_ADDED | COMMENT_UPDATED | COMMENT_DELETED",
  "comment": { ...Comment object... },
  "actorId": "string"
}
```

**UI uses this to:** live-append new comments in `IssueActivity` without requiring a manual refresh.

---

### 7. Typing indicator

```
/topic/org/{orgId}/issue/{issueId}/typing
```

**Payload:**
```json
{
  "userId": "string",
  "firstName": "string",
  "isTyping": true
}
```

**UI uses this to:** show "Alice is typing…" below the comment box. Clears automatically after 3 seconds without a new typing event.

---

### 8. In-app notifications (push channel)

```
/topic/org/{orgId}/user/{userId}/notifications
```

**Payload:**
```json
{
  "notification": { ...Notification object (same as REST API)... }
}
```

**UI uses this to:** replace the 30-second polling of `GET /api/notifications/unread-count`. When a notification arrives, increment the bell badge and prepend to the Inbox list if it's open.

---

### 9. Board column / board config changes

```
/topic/org/{orgId}/board/{boardId}/config
```

**Payload — `BoardConfigEvent`:**
```json
{
  "eventType": "COLUMN_CREATED | COLUMN_UPDATED | COLUMN_DELETED | BOARD_UPDATED",
  "board": { ...Board object... } | null,
  "column": { ...BoardColumn object... } | null,
  "actorId": "string"
}
```

**UI uses this to:** live-update board column names/colors and keep the issue kanban columns in sync.

---

## STOMP Subscriptions (Client → Server)

### Heartbeat / active board

```
SEND /app/presence/join
{
  "boardId": "string | null"   // null = user is not on any board
}
```

Client sends this every 20 seconds to keep the presence TTL alive in Redis.

```
SEND /app/presence/leave
{
  "boardId": "string"
}
```

Client sends this on `beforeunload` or when navigating away from a board.

### Typing indicator

```
SEND /app/typing
{
  "issueId": "string",
  "isTyping": true | false
}
```

---

## REST Endpoints (on realtime-service or notification-service)

### Get current board presence

```
GET /api/presence/board/{boardId}
```

**Response:**
```json
{
  "users": [
    {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "avatarUrl": "string | null",
      "joinedAt": "ISO-8601"
    }
  ]
}
```

**UI uses this to:** render the initial presence list when opening a board, before WebSocket events start arriving.

---

## Redis Keys (Presence Layer)

```
presence:{orgId}:{userId}          → { boardId, connectedAt, lastSeenAt }   TTL: 30s
board_viewers:{orgId}:{boardId}    → Set<userId>                             TTL: 30s
issue_viewers:{orgId}:{issueId}    → Set<userId>                             TTL: 60s
typing:{orgId}:{issueId}:{userId}  → 1                                       TTL: 3s
```

---

## Kafka Topics the Realtime Service Must Consume

| Topic | Events forwarded to WebSocket |
|-------|-------------------------------|
| `bento.issue.events` | IssueCreated, IssueUpdated, IssueMoved, IssueDeleted → `/board/{id}/issues` |
| `bento.issue.events` | IssueCommented, CommentUpdated, CommentDeleted → `/issue/{id}/comments` |
| `bento.sprint.events` | SprintCreated, SprintUpdated, SprintStarted, SprintCompleted → `/board/{id}/sprints` |
| `bento.board.events` | ColumnCreated/Updated/Deleted, BoardUpdated → `/board/{id}/config` |
| `bento.epic.events` | EpicCreated, EpicUpdated, EpicDeleted → `/board/{id}/epics` |
| `bento.notification.events` | NotificationCreated → `/user/{id}/notifications` |

> **Note:** `bento.issue.events`, `bento.sprint.events`, and `bento.epic.events` are not yet published by task-service. These must be implemented there before the realtime service can forward them.

---

## Frontend Integration Plan

### New file: `src/lib/websocket.ts`

```typescript
import { Client, type IMessage } from '@stomp/stompjs'

let client: Client | null = null

export function connectWebSocket(token: string, onConnect?: () => void) {
  client = new Client({
    brokerURL: `${import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080'}/ws`,
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 3000,
    onConnect,
  })
  client.activate()
  return client
}

export function disconnectWebSocket() {
  client?.deactivate()
  client = null
}

export function getClient() { return client }
```

**Library:** `@stomp/stompjs` (already compatible with Spring WebSocket)

---

### New store: `src/stores/realtimeStore.ts`

```typescript
// Zustand slice for WebSocket connection state + presence data
interface RealtimeStore {
  connected: boolean
  boardPresence: Record<string, OnlineUser[]>   // boardId → users
  issueViewers: Record<string, OnlineUser[]>    // issueId → users
  typingUsers: Record<string, OnlineUser[]>     // issueId → users typing
  setConnected(v: boolean): void
  setBoardPresence(boardId: string, users: OnlineUser[]): void
  addPresenceUser(boardId: string, user: OnlineUser): void
  removePresenceUser(boardId: string, userId: string): void
  setTyping(issueId: string, user: OnlineUser, isTyping: boolean): void
}
```

---

### New hook: `src/hooks/useRealtimeBoard.ts`

```typescript
// Subscribe to board-level events and pump into React Query cache
export function useRealtimeBoard(boardId: string) {
  const queryClient = useQueryClient()
  const client = getClient()

  useEffect(() => {
    if (!client?.connected) return
    const subs = [
      client.subscribe(`/topic/org/${orgId}/board/${boardId}/issues`, (msg) => {
        const event = JSON.parse(msg.body)
        // patch React Query cache optimistically
        queryClient.setQueryData(queryKeys.issues.list(boardId), ...)
      }),
      client.subscribe(`/topic/org/${orgId}/board/${boardId}/sprints`, ...),
      client.subscribe(`/topic/org/${orgId}/board/${boardId}/presence`, ...),
      client.subscribe(`/topic/org/${orgId}/board/${boardId}/config`, ...),
    ]
    // send presence join
    client.publish({ destination: '/app/presence/join', body: JSON.stringify({ boardId }) })
    return () => {
      subs.forEach((s) => s.unsubscribe())
      client.publish({ destination: '/app/presence/leave', body: JSON.stringify({ boardId }) })
    }
  }, [boardId, client?.connected])
}
```

---

### New hook: `src/hooks/useRealtimeIssue.ts`

```typescript
// Subscribe to single-issue events (IssueDetailPanel)
export function useRealtimeIssue(issueId: string) {
  // subscribe to /issue/{id}/comments
  // subscribe to /issue/{id}/presence
  // subscribe to /issue/{id}/typing
  // send VIEWING presence event on mount, LEFT on unmount
}
```

---

## UI Components to Build (Once Backend Ready)

### 1. Presence avatars — Board header

**File:** `src/components/board/BoardPresence.tsx`

- Shows up to 4 avatars of currently online users in the board header
- Overflow: "+3 more" pill
- Tooltip on hover: user name + "Online now"
- Green dot on avatar to indicate active
- Data: initial load from REST, updates via WebSocket

### 2. Typing indicator — IssueDetailPanel comment area

**File:** `src/components/issues/detail/IssueActivity.tsx` (existing, add below textarea)

- Shows "Alice is typing…" with animated dots
- Clears automatically after 3 seconds
- Multiple: "Alice and Bob are typing…"

### 3. Live notification badge — Header bell

**File:** `src/components/layout/Header.tsx` (update existing)

- Remove the 30-second polling
- Subscribe to `/topic/org/{orgId}/user/{userId}/notifications`
- Animate badge on new notification (brief scale pulse)

### 4. Connection status indicator

**File:** `src/components/ui/ConnectionStatus.tsx` (new, minimal)

- Subtle bar at top of screen (similar to GitHub's offline banner)
- Shows only when WebSocket is disconnected
- "Reconnecting…" with spinner, then disappears on reconnect
- Does not block UI — app still works via REST

### 5. Issue card — "being edited" overlay

**File:** `src/components/board/IssueCard.tsx` (update existing)

- Subtle left-border pulse animation when another user is actively editing this issue
- Small avatar in corner of card

---

## React Query + WebSocket Cache Strategy

When a WebSocket event arrives, update React Query cache **directly** instead of calling `invalidateQueries`:

```typescript
// PREFER (no extra network request):
queryClient.setQueryData(queryKeys.issues.list(boardId), (old) => {
  if (!old) return old
  return { ...old, content: old.content.map((i) => i.id === event.issue.id ? event.issue : i) }
})

// FALLBACK (if event payload is incomplete):
queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(boardId) })
```

This gives instant UI updates with zero additional HTTP requests.

---

## Environment Variables to Add

```bash
# .env.local
VITE_WS_URL=ws://localhost:8080    # proxied through api-gateway
```

---

## Future Features (Plan-Ahead Notes)

1. **Conflict resolution for simultaneous edits** — If two users edit an issue title at the same time, last-write-wins is acceptable for now. Future: operational transform (OT) or CRDT for description/rich-text fields. The description editor should broadcast `EDITING` presence to warn other users.

2. **Cursor tracking in description editor** — Once Tiptap is the description editor, use Tiptap's Collaboration extension (Y.js + WebSocket) for true multi-cursor editing in the description field. This would replace the custom WebSocket with a Y.js provider but only for the description field.

3. **Board-level broadcast messages** — Allow admins to send a message to all users currently viewing a board (e.g. "Sprint 4 is starting in 5 minutes"). Topic: `/topic/org/{orgId}/board/{boardId}/announcements`.

4. **Emoji reactions on issues** — `IssueReactionEvent` added to `bento.issue.events`, forwarded in real-time. UI: emoji picker + live reaction counts on IssueCard.

5. **Live sprint burndown** — When issues are completed during a sprint, push `BurndownPointEvent` to `/topic/org/{orgId}/board/{boardId}/burndown`. UI: auto-refreshing burndown chart without manual reload.

6. **Cross-device sync** — A user with multiple tabs open should receive the same events. Redis Pub/Sub fan-out on the realtime-service handles this automatically if each instance subscribes to a shared Redis channel.

7. **Activity feed (org-level)** — A global stream of all issue/sprint/member events across all boards in the org. Topic: `/topic/org/{orgId}/activity`. UI: "What's happening" feed in a future home dashboard.

8. **Audit log streaming** — Stream security events (login, permission changes, bulk deletes) to org admins via `/topic/org/{orgId}/audit`. Only visible to OWNER/ADMIN roles.