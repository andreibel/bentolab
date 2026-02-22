# Bento — Entity Documentation

Complete database schema for all microservices.

---

## Overview

| Service | Database | Entities |
|---------|----------|----------|
| Auth | PostgreSQL | User, RefreshToken |
| Org | PostgreSQL | Organization, OrganizationMember, OrgInvitation |
| Board | PostgreSQL | Board, BoardColumn, BoardMember, Label |
| Task | MongoDB | Issue, Sprint, Comment, TimeLog, Activity, IssueRelation, SavedFilter |
| Notification | MongoDB | Notification, NotificationPreference (Redis) |

---

## Auth Service Entities

### User

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| password | VARCHAR(255) | NOT NULL | BCrypt hashed |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| avatar_url | VARCHAR(500) | NULLABLE | Profile image URL |
| system_role | VARCHAR(20) | NOT NULL, DEFAULT 'USER' | SUPER_ADMIN, USER |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Account status |
| is_email_verified | BOOLEAN | NOT NULL, DEFAULT false | Email verification |
| last_login_at | TIMESTAMP | NULLABLE | Last login time |
| current_org_id | UUID | NULLABLE | Currently selected org |
| timezone | VARCHAR(50) | NOT NULL, DEFAULT 'UTC' | User timezone |
| locale | VARCHAR(10) | NOT NULL, DEFAULT 'en' | Language preference |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**Indexes:**
- `UNIQUE(email)`
- `INDEX(is_active)`
- `INDEX(current_org_id)`

---

### RefreshToken

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| token | VARCHAR(500) | UNIQUE, NOT NULL | Token string |
| user_id | UUID | FK → User, NOT NULL | Token owner |
| device_info | VARCHAR(255) | NULLABLE | Browser/device info |
| ip_address | VARCHAR(45) | NULLABLE | Client IP |
| expires_at | TIMESTAMP | NOT NULL | Expiration time |
| revoked | BOOLEAN | NOT NULL, DEFAULT false | Revocation status |
| created_at | TIMESTAMP | NOT NULL | |

**Indexes:**
- `UNIQUE(token)`
- `INDEX(user_id)`
- `INDEX(expires_at)`

---

## Org Service Entities

### Organization

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(200) | NOT NULL | Display name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly identifier |
| domain | VARCHAR(200) | NULLABLE | Custom domain (cloud) |
| logo_url | VARCHAR(500) | NULLABLE | Organization logo |
| description | TEXT | NULLABLE | |
| plan | VARCHAR(20) | NOT NULL, DEFAULT 'FREE' | FREE, STARTER, BUSINESS, ENTERPRISE |
| settings | JSONB | NOT NULL, DEFAULT '{}' | Configuration JSON |
| owner_id | UUID | NOT NULL | Organization owner |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | |
| is_default | BOOLEAN | NOT NULL, DEFAULT false | Default org for user |
| setup_completed | BOOLEAN | NOT NULL, DEFAULT false | Onboarding status |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**Settings JSON:**
```json
{
  "maxUsers": 10,
  "maxBoards": 5,
  "maxStorageGB": 5,
  "allowDiscord": true,
  "allowExport": true,
  "customBranding": false,
  "ssoEnabled": false
}
```

**Indexes:**
- `UNIQUE(slug)`
- `INDEX(owner_id)`
- `INDEX(is_active)`

---

### OrganizationMember

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| org_id | UUID | FK → Organization, NOT NULL | |
| user_id | UUID | NOT NULL | Member user ID |
| org_role | VARCHAR(20) | NOT NULL | ORG_OWNER, ORG_ADMIN, ORG_MEMBER |
| invited_by | UUID | NULLABLE | Who invited this member |
| joined_at | TIMESTAMP | NOT NULL | |

**Indexes:**
- `UNIQUE(org_id, user_id)`
- `INDEX(org_id)`
- `INDEX(user_id)`

---

### OrgInvitation

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| org_id | UUID | FK → Organization, NOT NULL | |
| email | VARCHAR(255) | NOT NULL | Invitee email |
| org_role | VARCHAR(20) | NOT NULL | ORG_ADMIN, ORG_MEMBER |
| token | VARCHAR(200) | UNIQUE, NOT NULL | Invitation token |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | PENDING, ACCEPTED, EXPIRED, REVOKED |
| invited_by | UUID | NOT NULL | Inviter user ID |
| message | TEXT | NULLABLE | Personal message |
| expires_at | TIMESTAMP | NOT NULL | 7 days default |
| accepted_at | TIMESTAMP | NULLABLE | |
| created_at | TIMESTAMP | NOT NULL | |

**Indexes:**
- `UNIQUE(token)`
- `INDEX(org_id, status)`
- `INDEX(email, status)`
- `INDEX(expires_at)`

---

## Board Service Entities

### Board

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| org_id | UUID | NOT NULL | Organization |
| name | VARCHAR(200) | NOT NULL | Board name |
| description | TEXT | NULLABLE | |
| board_key | VARCHAR(10) | NOT NULL | Issue prefix ("TF", "BUG") |
| board_type | VARCHAR(20) | NOT NULL | SCRUM, KANBAN, BUG_TRACKING, CUSTOM |
| background | VARCHAR(100) | NULLABLE | Color or image URL |
| owner_id | UUID | NOT NULL | Board owner |
| is_archived | BOOLEAN | NOT NULL, DEFAULT false | |
| issue_counter | INTEGER | NOT NULL, DEFAULT 0 | Auto-increment for issues |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**Indexes:**
- `UNIQUE(org_id, board_key)`
- `INDEX(org_id)`
- `INDEX(owner_id)`
- `INDEX(org_id, is_archived)`

---

### BoardColumn

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| board_id | UUID | FK → Board, NOT NULL | |
| name | VARCHAR(200) | NOT NULL | Column name |
| position | INTEGER | NOT NULL | Sort order |
| color | VARCHAR(7) | NULLABLE | Hex color (#FF5733) |
| wip_limit | INTEGER | NULLABLE | Max tasks in column |
| is_initial | BOOLEAN | NOT NULL, DEFAULT false | New issues land here |
| is_final | BOOLEAN | NOT NULL, DEFAULT false | Issues here = done |
| created_at | TIMESTAMP | NOT NULL | |

**Indexes:**
- `INDEX(board_id, position)`
- `UNIQUE(board_id, name)`

---

### BoardMember

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| board_id | UUID | FK → Board, NOT NULL | |
| user_id | UUID | NOT NULL | Member user ID |
| board_role | VARCHAR(20) | NOT NULL | PRODUCT_OWNER, SCRUM_MASTER, DEVELOPER, VIEWER |
| joined_at | TIMESTAMP | NOT NULL | |
| added_by | UUID | NULLABLE | Who added this member |

**Indexes:**
- `UNIQUE(board_id, user_id)`
- `INDEX(board_id)`
- `INDEX(user_id)`

---

### Label

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| org_id | UUID | NOT NULL | Organization |
| board_id | UUID | FK → Board, NOT NULL | |
| name | VARCHAR(100) | NOT NULL | Label name |
| color | VARCHAR(7) | NOT NULL | Hex color |
| description | VARCHAR(200) | NULLABLE | |
| created_at | TIMESTAMP | NOT NULL | |

**Indexes:**
- `UNIQUE(board_id, name)`
- `INDEX(org_id, board_id)`

---

## Task Service Entities (MongoDB)

### Issue
```javascript
{
  _id: ObjectId,
  orgId: String,           // indexed
  boardId: String,         // indexed
  issueKey: String,        // unique per org ("TF-42")
  
  // Classification
  type: String,            // EPIC, STORY, TASK, BUG, SUBTASK
  priority: String,        // CRITICAL, HIGH, MEDIUM, LOW
  severity: String,        // BLOCKER, CRITICAL, MAJOR, MINOR, TRIVIAL (bugs only)
  status: String,          // BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, TESTING, DONE, CANCELLED
  
  // Content
  title: String,
  description: String,     // markdown
  
  // Position
  columnId: String,
  position: Integer,
  
  // People
  reporterId: String,
  assigneeId: String,
  watcherIds: [String],
  
  // Dates
  startDate: Date,
  dueDate: Date,
  completedAt: Date,
  resolvedAt: Date,
  
  // Time Tracking
  estimatedHours: Double,
  totalTimeSpent: Double,
  remainingHours: Double,
  
  // Scrum
  storyPoints: Integer,    // 1, 2, 3, 5, 8, 13, 21
  sprintId: String,
  epicId: String,
  parentIssueId: String,
  
  // Organization
  labels: [{
    name: String,
    color: String
  }],
  components: [String],
  
  // Embedded
  checklist: [{
    id: String,
    text: String,
    checked: Boolean,
    assigneeId: String,
    position: Integer
  }],
  attachments: [{
    id: String,
    fileName: String,
    fileUrl: String,
    fileSize: Long,
    mimeType: String,
    uploadedBy: String,
    uploadedAt: Date
  }],
  
  // Analytics
  statusHistory: [{
    status: String,
    enteredAt: Date,
    exitedAt: Date,
    duration: Long
  }],
  reassignmentCount: Integer,
  commentCount: Integer,
  statusChangeCount: Integer,
  
  // Metadata
  createdBy: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `UNIQUE(orgId, issueKey)`
- `INDEX(orgId, boardId)`
- `INDEX(orgId, assigneeId)`
- `INDEX(orgId, sprintId)`
- `INDEX(orgId, epicId)`
- `INDEX(orgId, status)`
- `INDEX(orgId, type)`
- `INDEX(orgId, dueDate)`
- `TEXT(title, description)`

---

### Sprint
```javascript
{
  _id: ObjectId,
  orgId: String,
  boardId: String,
  name: String,            // "Sprint 23"
  goal: String,
  status: String,          // PLANNED, ACTIVE, COMPLETED
  startDate: Date,
  endDate: Date,
  duration: Integer,       // days, default 14
  
  // Metrics
  totalPoints: Integer,
  completedPoints: Integer,
  totalIssues: Integer,
  completedIssues: Integer,
  velocity: Double,
  
  // Scope Changes
  scopeChanges: {
    addedCount: Integer,
    removedCount: Integer
  },
  
  // Retrospective
  retrospective: {
    whatWentWell: [String],
    whatWentWrong: [String],
    actionItems: [String]
  },
  
  createdBy: String,
  createdAt: Date,
  completedAt: Date
}
```

**Indexes:**
- `INDEX(orgId, boardId)`
- `INDEX(orgId, status)`

---

### Comment
```javascript
{
  _id: ObjectId,
  orgId: String,
  issueId: String,
  userId: String,
  text: String,            // markdown
  mentionedUserIds: [String],
  isEdited: Boolean,
  isDeleted: Boolean,      // soft delete
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `INDEX(orgId, issueId, createdAt)`

---

### TimeLog
```javascript
{
  _id: ObjectId,
  orgId: String,
  issueId: String,
  userId: String,
  boardId: String,
  hoursSpent: Double,
  date: Date,              // work date
  description: String,
  createdAt: Date
}
```

**Indexes:**
- `INDEX(orgId, issueId)`
- `INDEX(orgId, userId, date)`
- `INDEX(orgId, boardId, date)`

---

### Activity
```javascript
{
  _id: ObjectId,
  orgId: String,
  issueId: String,
  boardId: String,
  sprintId: String,
  userId: String,
  
  entityType: String,      // ISSUE, BOARD, SPRINT, COMMENT, MEMBER
  action: String,          // CREATED, UPDATED, DELETED, MOVED, ASSIGNED, etc.
  
  details: {
    field: String,
    oldValue: String,
    newValue: String,
    metadata: Object
  },
  
  createdAt: Date
}
```

**Indexes:**
- `INDEX(orgId, issueId, createdAt)`
- `INDEX(orgId, boardId, createdAt)`
- `INDEX(orgId, userId, createdAt)`

---

### IssueRelation
```javascript
{
  _id: ObjectId,
  orgId: String,
  sourceIssueId: String,
  targetIssueId: String,
  relationType: String,    // BLOCKS, BLOCKED_BY, RELATES_TO, DUPLICATES, etc.
  createdBy: String,
  createdAt: Date
}
```

**Indexes:**
- `INDEX(orgId, sourceIssueId)`
- `INDEX(orgId, targetIssueId)`
- `UNIQUE(sourceIssueId, targetIssueId, relationType)`

---

### SavedFilter
```javascript
{
  _id: ObjectId,
  orgId: String,
  boardId: String,
  userId: String,
  name: String,            // "My Bugs"
  isShared: Boolean,
  
  filters: {
    types: [String],
    statuses: [String],
    priorities: [String],
    assigneeIds: [String],
    labelNames: [String],
    sprintId: String,
    dueDateFrom: Date,
    dueDateTo: Date,
    searchText: String
  },
  
  createdAt: Date
}
```

**Indexes:**
- `INDEX(orgId, boardId, userId)`

---

## Notification Service Entities (MongoDB)

### Notification
```javascript
{
  _id: ObjectId,
  orgId: String,
  userId: String,
  
  type: String,            // TASK_ASSIGNED, COMMENT_ADDED, DUE_DATE_REMINDER, etc.
  title: String,
  message: String,
  
  issueId: String,
  issueKey: String,
  boardId: String,
  sprintId: String,
  triggeredBy: String,
  
  isRead: Boolean,
  readAt: Date,
  
  emailSent: Boolean,
  emailSentAt: Date,
  discordSent: Boolean,
  discordSentAt: Date,
  
  createdAt: Date
}
```

**Indexes:**
- `INDEX(orgId, userId, isRead, createdAt)`
- `INDEX(orgId, userId, createdAt)`
- `INDEX(createdAt)` — TTL 90 days

---

## Redis Cache Keys

| Key Pattern | Value | TTL | Purpose |
|-------------|-------|-----|---------|
| `session:{userId}:{orgId}` | JSON | 24h | Active sessions |
| `blacklist:{jwtToken}` | "true" | JWT expiry | Revoked tokens |
| `pwd_reset:{token}` | userId | 1h | Password reset |
| `org_config:{orgSlug}` | JSON | 1h | Org settings cache |
| `user:{userId}:profile` | JSON | 1h | User profile cache |
| `board:{orgId}:{boardId}` | JSON | 30m | Board with columns |
| `sprint:{orgId}:active:{boardId}` | JSON | 15m | Active sprint |
| `count:{orgId}:board:{boardId}` | Integer | 30m | Issue count |
| `recent:{orgId}:{userId}` | List | 1h | Recently viewed |
| `notif_pref:{orgId}:{userId}` | Hash | ∞ | Notification prefs |

---

## Kafka Topics

| Topic | Publisher | Consumers | Events |
|-------|-----------|-----------|--------|
| `bento.user.events` | Auth | Org, Notification | registered, logged_in, updated, deactivated |
| `bento.org.events` | Org | Board, Notification | created, member_invited, member_joined, member_removed |
| `bento.board.events` | Board | Task, Notification | created, updated, archived, member_added |
| `bento.issue.events` | Task | Notification, Analytics | created, updated, moved, assigned, completed |
| `bento.sprint.events` | Task | Notification, Analytics | created, started, completed |
| `bento.notification.events` | Notification | Analytics | email_sent, discord_sent, failed |
