# Notification Service — Backend Requirements & UI Contract

## Overview

The notification service (port 8085, MongoDB + Redis) handles in-app, email, and Discord alerts for all user-facing events across Bento. The frontend has a placeholder Inbox page and a header bell icon already wired up — this document defines exactly what the backend must expose to make them functional.

---

## Current Frontend State

| Component | File | Status |
|-----------|------|--------|
| Bell icon + unread dot | `src/components/layout/Header.tsx` | Static — needs real count |
| Inbox page | `src/pages/InboxPage.tsx` | Placeholder — needs real data |
| Sidebar "Inbox" nav item | `src/components/layout/Sidebar.tsx` | Navigates to `/inbox` |
| Notification types (mock) | `src/pages/InboxPage.tsx` | MENTION, ASSIGNED, SPRINT, SYSTEM |

---

## REST API Required by the UI

### Base path: `GET /api/notifications`
All endpoints require JWT auth (gateway passes `X-User-Id`, `X-Org-Id`).

---

### 1. List notifications (paginated)

```
GET /api/notifications?page=0&size=20&filter=ALL|UNREAD|MENTION|ASSIGNED|SPRINT
```

**Response:**
```json
{
  "content": [
    {
      "id": "string",
      "type": "ISSUE_ASSIGNED | ISSUE_COMMENTED | ISSUE_MENTIONED | ISSUE_STATUS_CHANGED | SPRINT_STARTED | SPRINT_COMPLETED | EPIC_UPDATED | BOARD_MEMBER_ADDED | MEMBER_INVITED | DUE_DATE_REMINDER | SYSTEM",
      "title": "string",
      "message": "string",
      "isRead": false,
      "readAt": null,
      "createdAt": "ISO-8601",
      "actor": {
        "id": "string",
        "firstName": "string",
        "lastName": "string",
        "avatarUrl": "string | null"
      },
      "context": {
        "issueId": "string | null",
        "issueKey": "string | null",
        "issueTitle": "string | null",
        "boardId": "string | null",
        "boardName": "string | null",
        "sprintId": "string | null",
        "sprintName": "string | null",
        "epicId": "string | null"
      }
    }
  ],
  "totalElements": 100,
  "totalPages": 5,
  "number": 0,
  "size": 20
}
```

---

### 2. Unread count (for bell badge)

```
GET /api/notifications/unread-count
```

**Response:**
```json
{ "count": 7 }
```

> The UI polls this endpoint every 30 seconds to update the header badge. When WebSocket is available, this polling will be replaced by a push event.

---

### 3. Mark single notification as read

```
PATCH /api/notifications/{id}/read
```

**Response:** `204 No Content`

---

### 4. Mark all as read

```
PATCH /api/notifications/read-all
```

**Response:** `204 No Content`

---

### 5. Delete a notification

```
DELETE /api/notifications/{id}
```

**Response:** `204 No Content`

---

### 6. Get notification preferences

```
GET /api/notifications/preferences
```

**Response:**
```json
{
  "inApp": {
    "ISSUE_ASSIGNED": true,
    "ISSUE_COMMENTED": true,
    "ISSUE_MENTIONED": true,
    "ISSUE_STATUS_CHANGED": false,
    "SPRINT_STARTED": true,
    "SPRINT_COMPLETED": true,
    "EPIC_UPDATED": false,
    "BOARD_MEMBER_ADDED": true,
    "DUE_DATE_REMINDER": true
  },
  "email": {
    "ISSUE_ASSIGNED": true,
    "ISSUE_COMMENTED": false,
    "ISSUE_MENTIONED": true,
    "SPRINT_STARTED": false,
    "SPRINT_COMPLETED": true,
    "DUE_DATE_REMINDER": true
  },
  "discord": {
    "webhookUrl": "string | null",
    "SPRINT_STARTED": true,
    "SPRINT_COMPLETED": true,
    "DUE_DATE_REMINDER": false
  },
  "digestMode": "REALTIME | HOURLY | DAILY | WEEKLY",
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00",
  "timezone": "America/New_York"
}
```

---

### 7. Update notification preferences

```
PUT /api/notifications/preferences
```

**Body:** Same shape as GET response, partial update allowed.

**Response:** `200 OK` with updated preferences.

---

## Kafka Events to Consume

The notification service must subscribe to these topics and create `Notification` documents:

| Topic | Event | Notification Type | Recipients |
|-------|-------|-------------------|------------|
| `bento.issue.events` | `IssueAssignedEvent` | `ISSUE_ASSIGNED` | new assignee |
| `bento.issue.events` | `IssueCommentedEvent` | `ISSUE_COMMENTED` | reporter + assignee + watchers |
| `bento.issue.events` | `IssueMentionedEvent` | `ISSUE_MENTIONED` | mentioned users |
| `bento.issue.events` | `IssueStatusChangedEvent` | `ISSUE_STATUS_CHANGED` | assignee + watchers |
| `bento.issue.events` | `IssueDueDateSetEvent` | `DUE_DATE_REMINDER` | assignee (scheduled) |
| `bento.sprint.events` | `SprintStartedEvent` | `SPRINT_STARTED` | all board members |
| `bento.sprint.events` | `SprintCompletedEvent` | `SPRINT_COMPLETED` | all board members |
| `bento.board.events` | `BoardMemberAddedEvent` | `BOARD_MEMBER_ADDED` | new member |
| `bento.org.events` | `InvitationCreatedEvent` | `MEMBER_INVITED` | invited user |
| `bento.org.events` | `MemberJoinedEvent` | `SYSTEM` | org admins |

> **Note:** `bento.issue.events` and `bento.sprint.events` are not yet published by task-service. They must be added there before the notification service can consume them.

---

## MongoDB Document Schema

```javascript
// Collection: notifications
{
  _id: ObjectId,
  orgId: String,           // required — for multi-tenancy isolation
  userId: String,          // recipient
  type: String,            // enum above
  title: String,           // short (max 80 chars) — shown in bell dropdown
  message: String,         // longer — shown in Inbox
  isRead: Boolean,         // default false
  readAt: Date | null,
  actor: {                 // who triggered the notification
    id: String,
    firstName: String,
    lastName: String,
    avatarUrl: String | null
  },
  context: {               // deep link targets
    issueId: String | null,
    issueKey: String | null,
    issueTitle: String | null,
    boardId: String | null,
    boardName: String | null,
    sprintId: String | null,
    sprintName: String | null,
    epicId: String | null
  },
  deliveredVia: {
    inApp: Boolean,
    email: Boolean,
    emailSentAt: Date | null,
    discord: Boolean,
    discordSentAt: Date | null
  },
  createdAt: Date          // TTL index — auto-delete after 90 days
}
```

**Required indexes:**
```javascript
{ userId: 1, orgId: 1, isRead: 1, createdAt: -1 }  // inbox queries
{ userId: 1, orgId: 1, createdAt: -1 }              // paginated list
{ createdAt: 1 }, expireAfterSeconds: 7776000       // 90-day TTL
```

---

## Redis — Notification Preferences Cache

```
Key:   notif_pref:{orgId}:{userId}
Value: JSON (NotificationPreference object)
TTL:   none (invalidate on preference update)
```

---

## UI Pages & Components Needed (Frontend Implementation)

### Phase 1 — Inbox Page (replaces placeholder)

**`/inbox`** — `src/pages/InboxPage.tsx`
- Header: "Inbox" title + unread count badge + "Mark all read" button
- Filter tabs: All · Unread · Mentions · Assigned · Sprints
- Notification list:
  - Actor avatar (from `actor` field)
  - Title + message
  - Relative time ("2m ago", "3h ago", "yesterday")
  - Unread dot on left edge
  - Click → navigate to `context.issueId` or `context.boardId`
  - Hover actions: mark read (✓), delete (trash)
- Empty state per filter
- Infinite scroll or "Load more"

### Phase 2 — Bell Dropdown (quick view)

**Header bell** — `src/components/layout/Header.tsx`
- Badge: unread count (hidden when 0, capped at 99+)
- Click opens a popover (not a full page) with last 5 unread notifications
- "View all" link → `/inbox`
- "Mark all read" button in popover footer
- Polling: `GET /api/notifications/unread-count` every 30s

### Phase 3 — Notification Preferences

**Settings page** — `/settings/notifications` (new route needed)
- Grouped toggles per notification type
- Email / In-app / Discord columns
- Digest mode selector: Real-time | Hourly | Daily | Weekly
- Quiet hours time range picker
- Discord webhook URL input + test button

---

## Notification Type → UI Icon & Color Mapping

```typescript
const NOTIFICATION_STYLE = {
  ISSUE_ASSIGNED:      { icon: UserPlus,     color: 'text-primary',    bg: 'bg-primary-subtle' },
  ISSUE_COMMENTED:     { icon: MessageSquare, color: 'text-blue-500',  bg: 'bg-blue-500/10' },
  ISSUE_MENTIONED:     { icon: AtSign,        color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ISSUE_STATUS_CHANGED:{ icon: ArrowRightLeft, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  SPRINT_STARTED:      { icon: Play,           color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  SPRINT_COMPLETED:    { icon: CheckCircle2,   color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  EPIC_UPDATED:        { icon: Layers,         color: 'text-primary',    bg: 'bg-primary-subtle' },
  BOARD_MEMBER_ADDED:  { icon: Users,          color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  MEMBER_INVITED:      { icon: Mail,           color: 'text-text-muted', bg: 'bg-surface-muted' },
  DUE_DATE_REMINDER:   { icon: Clock,          color: 'text-red-500',    bg: 'bg-red-500/10' },
  SYSTEM:              { icon: Bell,           color: 'text-text-muted', bg: 'bg-surface-muted' },
}
```

---

## React Query Keys to Add

```typescript
// In src/api/queryKeys.ts
notifications: {
  list:        (orgId: string, filter: string) => ['notifications', orgId, filter],
  unreadCount: (orgId: string)                 => ['notifications', orgId, 'unread-count'],
  preferences: (orgId: string)                 => ['notifications', orgId, 'preferences'],
}
```

---

## Future Features (Plan-Ahead Notes)

These are not needed now but the schema and API should accommodate them:

1. **@mentions in comments** — `Comment.mentionedUserIds[]` already exists in the Issue type. When a user is mentioned, dispatch `IssueMentionedEvent` with the comment content and mentioned user IDs.

2. **Issue watcher subscriptions** — `Issue.watcherIds[]` already in the schema. Watchers should receive status change and comment notifications. UI: "Watch" button in `IssueDetailPanel`.

3. **Due-date reminder scheduling** — When `issue.dueDate` is set, notification service should schedule a reminder for 24h before. Needs a scheduled job (Quartz or Spring @Scheduled).

4. **Notification grouping** — Group multiple notifications of the same type (e.g. "5 people commented on BEN-42") into a single notification item. Display as expandable group in Inbox.

5. **Board-level notification muting** — Let users silence all notifications from a specific board. Preference key: `muted_board:{orgId}:{userId}:{boardId}` in Redis.

6. **Mobile push notifications** — Reserved field `deliveredVia.push` in schema. Requires a future mobile app integration (FCM/APNs).

7. **Digest emails** — When `digestMode` is `HOURLY`/`DAILY`/`WEEKLY`, batch undelivered email notifications and send a single digest email. Suppress individual emails until next digest.

8. **Notification analytics** — Count open-rates, click-through from email links. Publish `NotificationOpenedEvent` to `bento.notification.events` when a notification is marked read.