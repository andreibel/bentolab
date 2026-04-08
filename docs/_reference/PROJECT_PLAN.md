# Bento — Project Plan

> Complete backlog of epics, milestones, sprints, and issues for the Bento project management system.
> Use this file as the source of truth when seeding the app with real demo data.
> All issues marked ✅ are already implemented. All issues marked 🔲 are planned work.

---

## Project Info

| Field | Value |
|---|---|
| Board key | `BENTO` |
| Owner | andreibel |
| Workflow | Scrum |
| Start date | 2026-02-01 |
| Target v1.0 | 2026-07-01 |

---

## Milestones

| # | Name | Target | Description |
|---|---|---|---|
| M1 | **Alpha** | 2026-03-15 | Core CRUD works end-to-end locally |
| M2 | **Beta** | 2026-05-01 | Feature-complete, test coverage ≥70%, CI/CD green |
| M3 | **v1.0 Release** | 2026-07-01 | Live on AWS, Kubernetes, public demo URL |
| M4 | **v1.1 — Integrations** | 2026-09-01 | GitHub, Slack, Discord, webhooks, OAuth |

---

## Epics

| Key | Title | Type | Priority | Milestone | Story Points |
|---|---|---|---|---|---|
| E-01 | UI Completion & Polish | Epic | High | M2 | 55 |
| E-02 | Real-time Features | Epic | High | M2 | 34 |
| E-03 | Notifications Pipeline | Epic | Medium | M2 | 21 |
| E-04 | Test Coverage | Epic | High | M2 | 40 |
| E-05 | CI/CD Pipeline | Epic | High | M3 | 26 |
| E-06 | Kubernetes & Docker | Epic | High | M3 | 34 |
| E-07 | Terraform — AWS Infrastructure | Epic | High | M3 | 30 |
| E-08 | Production Hardening | Epic | Critical | M3 | 28 |
| E-09 | Monitoring & Observability | Epic | Medium | M3 | 21 |
| E-10 | Authentication Upgrades | Epic | Medium | M4 | 18 |
| E-11 | Third-party Integrations | Epic | Low | M4 | 30 |
| E-12 | Advanced Features | Epic | Low | M4 | 40 |

---

## Sprints

| # | Name | Goal | Start | End | Status |
|---|---|---|---|---|---|
| S-01 | Foundation Sprint | Core auth, org, board CRUD working end-to-end | 2026-02-01 | 2026-02-14 | Completed |
| S-02 | Board & Issues Sprint | Kanban board, issue CRUD, drag-and-drop | 2026-02-15 | 2026-02-28 | Completed |
| S-03 | Sprint & Epic Sprint | Sprint planning, epics, milestones, backlog | 2026-03-01 | 2026-03-14 | Completed |
| S-04 | Real-time & Notifications | WebSocket presence, notification pipeline | 2026-03-15 | 2026-03-30 | Completed |
| S-05 | UI Polish Sprint | Design pass on all pages, responsive, RTL | 2026-04-01 | 2026-04-14 | Active |
| S-06 | Test Coverage Sprint | Backend unit + integration tests ≥70% | 2026-04-15 | 2026-04-30 | Planned |
| S-07 | CI/CD Sprint | GitHub Actions, Docker build/push, ECR | 2026-05-01 | 2026-05-14 | Planned |
| S-08 | Kubernetes Sprint | K8s manifests, Helm charts, EKS deploy | 2026-05-15 | 2026-05-31 | Planned |
| S-09 | AWS Infra Sprint | Terraform VPC, EKS, RDS, ElastiCache, S3 | 2026-06-01 | 2026-06-14 | Planned |
| S-10 | Production Launch Sprint | TLS, domain, secrets, smoke tests, go-live | 2026-06-15 | 2026-07-01 | Planned |
| S-11 | Integrations Sprint | GitHub, Slack, Discord, OAuth, webhooks | 2026-07-01 | 2026-08-01 | Planned |

---

## Issues

> Format per issue: Key, Type, Title, Priority, Severity, Story Points, Sprint, Epic, Status, Estimated Hours, Labels, Description, Checklist

---

---

### SPRINT S-01 — Foundation Sprint ✅ Completed

---

#### BENTO-001 ✅
- **Type**: Task
- **Title**: Scaffold all microservice modules in Gradle multi-project build
- **Priority**: Critical
- **Story Points**: 3
- **Sprint**: S-01
- **Epic**: E-08
- **Status**: Done
- **Labels**: `backend`
- **Description**:
  Set up `settings.gradle` with all service modules and shared libs. Configure root `build.gradle` with Spring Boot BOM, JaCoCo, shared dependencies (Lombok, Actuator, Security, Kafka). Verify `./gradlew build` passes for all modules.

---

#### BENTO-002 ✅
- **Type**: Task
- **Title**: Design and implement JWT authentication flow (auth-service + api-gateway)
- **Priority**: Critical
- **Story Points**: 8
- **Sprint**: S-01
- **Epic**: E-08
- **Status**: Done
- **Labels**: `backend`, `auth`, `security`
- **Description**:
  - `auth-service`: register, login, refresh, logout endpoints
  - `auth-service`: issue JWT with `userId`, `orgId`, `orgRole`, `orgSlug`, `iat`, `exp`
  - `api-gateway`: `JwtAuthFilter` validates JWT on every request
  - `api-gateway`: forward `X-User-Id`, `X-Org-Id`, `X-Org-Role`, `X-Org-Slug` headers to downstream services
  - `libs/security-common`: `GatewayAuthFilter` validates `X-Internal-Secret` in all microservices

---

#### BENTO-003 ✅
- **Type**: Task
- **Title**: Implement organization CRUD and member management (org-service)
- **Priority**: Critical
- **Story Points**: 5
- **Sprint**: S-01
- **Epic**: E-08
- **Status**: Done
- **Labels**: `backend`
- **Description**:
  Create org, update org, delete org, list orgs for user. Add member, remove member, list members. Role-based access (OWNER, ADMIN, MEMBER, GUEST).

---

#### BENTO-004 ✅
- **Type**: Task
- **Title**: Implement invitation system with email token (org-service + notification-service)
- **Priority**: High
- **Story Points**: 5
- **Sprint**: S-01
- **Epic**: E-03
- **Status**: Done
- **Labels**: `backend`, `auth`
- **Description**:
  Create invitation → publish `InvitationCreatedEvent` → notification-service sends email with invite link → user clicks → `acceptInvitation` endpoint validates token, creates member record.

---

#### BENTO-005 ✅
- **Type**: Task
- **Title**: Implement stale token detection via Kafka + Redis (api-gateway)
- **Priority**: High
- **Story Points**: 5
- **Sprint**: S-01
- **Epic**: E-08
- **Status**: Done
- **Labels**: `backend`, `api-gateway`, `kafka`, `security`
- **Description**:
  When a member is removed or role changes, org-service publishes event → api-gateway consumes → writes `stale:{userId}:{orgId}` key in Redis. `JwtAuthFilter` checks Redis on every request: if `JWT.iat < staleTimestamp` → return 401 `TOKEN_STALE`.

---

#### BENTO-006 ✅
- **Type**: Task
- **Title**: Build React project skeleton — routing, auth store, Axios client, React Query
- **Priority**: Critical
- **Story Points**: 5
- **Sprint**: S-01
- **Epic**: E-01
- **Status**: Done
- **Labels**: `frontend`
- **Description**:
  Vite + React 19 + TypeScript setup. TailwindCSS 4 configured. React Router with protected routes. Zustand `authStore` (accessToken, user, orgId, orgRole). Axios instance with interceptors for Bearer token and automatic refresh on 401. React Query `QueryClient` provider.

---

#### BENTO-007 ✅
- **Type**: Task
- **Title**: Implement login, register, email verification, password reset pages
- **Priority**: Critical
- **Story Points**: 5
- **Sprint**: S-01
- **Epic**: E-01
- **Status**: Done
- **Labels**: `frontend`, `auth`
- **Description**:
  6 auth pages: Login, Register, ForgotPassword, ResetPassword, VerifyEmail, InviteAccept. Form validation with React Hook Form + Zod. Connected to auth-service API.

---

#### BENTO-008 ✅
- **Type**: Task
- **Title**: Subdomain-based organization switching
- **Priority**: High
- **Story Points**: 3
- **Sprint**: S-01
- **Epic**: E-08
- **Status**: Done
- **Labels**: `frontend`, `backend`
- **Description**:
  Parse subdomain from `window.location.hostname` → pass `orgSlug` to login → auth-service resolves org and encodes in JWT. Org selector UI for switching between orgs without subdomain.

---

### SPRINT S-02 — Board & Issues Sprint ✅ Completed

---

#### BENTO-011 ✅
- **Type**: Task
- **Title**: Implement board CRUD with columns (board-service)
- **Priority**: Critical
- **Story Points**: 5
- **Sprint**: S-02
- **Epic**: E-08
- **Status**: Done
- **Labels**: `backend`
- **Description**:
  Create, update, delete boards. Create, update, delete, reorder columns (position field). WIP limit on columns. Board types: Kanban, Scrum. Board members with roles (OWNER, ADMIN, EDITOR, VIEWER). Labels CRUD.

---

#### BENTO-012 ✅
- **Type**: Task
- **Title**: Implement full issue lifecycle (task-service)
- **Priority**: Critical
- **Story Points**: 8
- **Sprint**: S-02
- **Epic**: E-08
- **Status**: Done
- **Labels**: `backend`
- **Description**:
  Issue CRUD: create, read, update, delete. Fields: title, description (markdown), type (Bug/Task/Story), priority, severity, assignee, reporter, column, sprint, epic, labels, checklist, story points, time estimate, due date, start date. Issue key generation (`TF-42`). Full-text search. `columnHistory` tracking for burndown data.

---

#### BENTO-013 ✅
- **Type**: Task
- **Title**: Implement comments, time logs, activity stream (task-service)
- **Priority**: High
- **Story Points**: 5
- **Sprint**: S-02
- **Epic**: E-08
- **Status**: Done
- **Labels**: `backend`
- **Description**:
  Comments CRUD on issues. Time log (log hours with note). Activity auto-generated on every issue change (who changed what, when). Issue relations: BLOCKS, DEPENDS_ON, RELATES_TO, DUPLICATES.

---

#### BENTO-014 ✅
- **Type**: Task
- **Title**: Build Kanban board with drag-and-drop (frontend)
- **Priority**: Critical
- **Story Points**: 8
- **Sprint**: S-02
- **Epic**: E-01
- **Status**: Done
- **Labels**: `frontend`, `dnd-kit`
- **Description**:
  `BoardPage.tsx` with `BoardColumn.tsx`. dnd-kit for dragging issue cards between columns. Optimistic update: move card immediately, revert on API error. `IssueCard.tsx` shows: key, title, priority icon, type icon, assignee avatar, label chips, story points badge.

---

#### BENTO-015 ✅
- **Type**: Task
- **Title**: Build full issue detail panel with comments, activity, attachments
- **Priority**: High
- **Story Points**: 8
- **Sprint**: S-02
- **Epic**: E-01
- **Status**: Done
- **Labels**: `frontend`
- **Description**:
  `IssueDetailPanel.tsx` slides in from the right. Tabs: Details, Comments, Activity, Attachments. Tiptap rich text editor for description with checklist support. Inline editable fields (title, assignee, priority, labels). Comment composer. Time log form. Activity feed with icons per event type.

---

#### BENTO-016 ✅
- **Type**: Task
- **Title**: Build board list page, create board wizard, board settings panel
- **Priority**: High
- **Story Points**: 5
- **Sprint**: S-02
- **Epic**: E-01
- **Status**: Done
- **Labels**: `frontend`
- **Description**:
  `BoardListPage.tsx` — grid of board cards. `CreateBoardWizard.tsx` — multi-step: name, key, type, initial columns. `BoardSettingsPanel.tsx` — edit name, type, manage columns (add/edit/delete/reorder), manage members. `DeleteBoardModal.tsx` with confirmation.

---

#### BENTO-017 ✅
- **Type**: Task
- **Title**: Implement file attachments (attachment-service + frontend)
- **Priority**: Medium
- **Story Points**: 5
- **Sprint**: S-02
- **Epic**: E-08
- **Status**: Done
- **Labels**: `backend`, `frontend`, `aws`
- **Description**:
  MinIO/S3-compatible storage. Upload file → get presigned URL → upload directly → store metadata in MongoDB. Download via presigned URL. Display attachment list in issue detail with file type icons and size. Delete attachment.

---

### SPRINT S-03 — Sprint & Epic Sprint ✅ Completed

---

#### BENTO-021 ✅
- **Type**: Task
- **Title**: Implement sprint lifecycle — create, start, complete (task-service)
- **Priority**: Critical
- **Story Points**: 5
- **Sprint**: S-03
- **Epic**: E-08
- **Status**: Done
- **Labels**: `backend`
- **Description**:
  Sprint CRUD. Start sprint (sets `status=ACTIVE`, validates only one active sprint per board). Complete sprint (moves incomplete issues to backlog or next sprint via `CompleteSprintRequest.targetSprintId`). Sprint goal, start/end dates, retrospective.

---

#### BENTO-022 ✅
- **Type**: Task
- **Title**: Implement epics and milestones (task-service)
- **Priority**: High
- **Story Points**: 3
- **Sprint**: S-03
- **Epic**: E-08
- **Status**: Done
- **Labels**: `backend`
- **Description**:
  Epic CRUD (name, description, color, boardId). Milestone CRUD. Issues reference `epicId`. Epic progress calculated from linked issues (done/total). Milestones have due date and linked issues.

---

#### BENTO-023 ✅
- **Type**: Task
- **Title**: Build backlog page with sprint planning drag-and-drop
- **Priority**: High
- **Story Points**: 8
- **Sprint**: S-03
- **Epic**: E-01
- **Status**: Done
- **Labels**: `frontend`
- **Description**:
  `BacklogPage.tsx` — issues not in any sprint grouped in backlog section. Sprint sections below backlog. Drag issue from backlog into a sprint or vice versa. Start sprint button per sprint. Create sprint modal. Sprint goal, date pickers inline. Issue count and story point total per sprint header.

---

#### BENTO-024 ✅
- **Type**: Task
- **Title**: Build sprint management page with burndown chart
- **Priority**: High
- **Story Points**: 5
- **Sprint**: S-03
- **Epic**: E-01
- **Status**: Done
- **Labels**: `frontend`
- **Description**:
  `SprintsPage.tsx` — active sprint header with goal, dates, progress. Issue list grouped by status. Burndown chart (Recharts LineChart — data placeholder until BENTO-905 is resolved). Complete sprint button with modal to handle incomplete issues.

---

#### BENTO-025 ✅
- **Type**: Task
- **Title**: Build board summary dashboard with widgets
- **Priority**: Medium
- **Story Points**: 8
- **Sprint**: S-03
- **Epic**: E-01
- **Status**: Done
- **Labels**: `frontend`
- **Description**:
  `SummaryPage.tsx` — 14 dashboard widgets: SprintHealth, Velocity, BugRate, TeamActivity, IssueBreakdown (by type/priority/status), TimeTracking, WorkloadDistribution, OpenIssuesTrend, CycleTime, LeadTime. Uses Recharts for charts. All wired to real API data.

---

#### BENTO-026 ✅
- **Type**: Task
- **Title**: Build saved filters and advanced issue search
- **Priority**: Medium
- **Story Points**: 3
- **Sprint**: S-03
- **Epic**: E-01
- **Status**: Done
- **Labels**: `frontend`, `backend`
- **Description**:
  Filter issues by: status, type, priority, assignee, epic, label, sprint, date range. Save filter as named preset. Load saved filters from sidebar. Clear filters button. Filter chip display (active filters shown as removable badges).

---

### SPRINT S-04 — Real-time & Notifications Sprint ✅ Completed

---

#### BENTO-031 ✅
- **Type**: Task
- **Title**: Implement WebSocket/STOMP infrastructure (realtime-service)
- **Priority**: High
- **Story Points**: 8
- **Sprint**: S-04
- **Epic**: E-02
- **Status**: Done
- **Labels**: `backend`, `websocket`
- **Description**:
  Spring WebSocket + STOMP. Handshake interceptor validates JWT. Presence tracking in Redis (who is on which board). Kafka consumers for board/issue/sprint events → broadcast to subscribed WebSocket clients. Redis Pub/Sub for cross-instance fan-out. STOMP topics for: issues, sprints, presence, board config, comments, typing, notifications.

---

#### BENTO-032 ✅
- **Type**: Task
- **Title**: Implement board presence — show online members in real time (frontend)
- **Priority**: High
- **Story Points**: 5
- **Sprint**: S-04
- **Epic**: E-02
- **Status**: Done
- **Labels**: `frontend`, `websocket`
- **Description**:
  `BoardPresenceAvatars.tsx` in board header — shows avatars of members currently viewing the board. Subscribes to `/topic/org/{orgId}/board/{boardId}/presence`. Updates on join/leave. Tooltip shows name and "viewing since X".

---

#### BENTO-033 ✅
- **Type**: Task
- **Title**: Implement notification-service email pipeline for auth and org events
- **Priority**: High
- **Story Points**: 5
- **Sprint**: S-04
- **Epic**: E-03
- **Status**: Done
- **Labels**: `backend`, `kafka`
- **Description**:
  `UserEventConsumer`: welcome email on register, verification email, password reset email. `OrgEventConsumer`: invitation email with token link, member joined welcome. SMTP via MailHog locally. Email templates as plain text with variable substitution.

---

#### BENTO-034 ✅
- **Type**: Task
- **Title**: Build inbox page and notification bell (frontend)
- **Priority**: Medium
- **Story Points**: 5
- **Sprint**: S-04
- **Epic**: E-01
- **Status**: Done
- **Labels**: `frontend`
- **Description**:
  `InboxPage.tsx` — list all notifications with read/unread state. Mark as read, mark all as read, delete. `NotificationBell.tsx` in header — unread count badge, dropdown preview of last 5. Notification types: issue assigned, comment, sprint started, invitation. Icons and color per type.

---

#### BENTO-035 ✅
- **Type**: Task
- **Title**: Build landing page with hero board mockup and feature showcase
- **Priority**: Medium
- **Story Points**: 5
- **Sprint**: S-04
- **Epic**: E-01
- **Status**: Done
- **Labels**: `frontend`
- **Description**:
  `LandingPage.tsx` — hero section with animated `HeroBoardMockup.tsx` (Framer Motion). Feature sections: Kanban, Scrum, Real-time, Analytics. CTA buttons. Responsive. Dark/light theme toggle.

---

### SPRINT S-05 — UI Polish Sprint (Active)

---

#### BENTO-101
- **Type**: Task
- **Title**: Implement global command palette (⌘K) with keyboard navigation
- **Priority**: High
- **Story Points**: 8
- **Sprint**: S-05
- **Epic**: E-01
- **Status**: In Progress
- **Assignee**: andreibel
- **Estimated Hours**: 12
- **Labels**: `frontend`, `ux`, `accessibility`
- **Description**:
  The `CommandPalette.tsx` component exists (54KB) but is not fully wired to live data. It needs to query the API for issues, boards, and members in real time as the user types.

  **Acceptance criteria**:
  - Opens with `⌘K` / `Ctrl+K`
  - Shows recent issues, boards, members
  - Live search results update as user types (debounced 200ms)
  - Keyboard navigation (↑ ↓ Enter Esc)
  - Grouped results: Issues / Boards / Members / Actions
  - Renders issue priority icon and board key

- **Checklist**:
  - [x] Component skeleton exists
  - [ ] Wire `useIssues` search hook
  - [ ] Wire `useBoards` list hook
  - [ ] Keyboard navigation (ArrowUp/Down)
  - [ ] Grouping headers
  - [ ] Recent items (localStorage)
  - [ ] Debounce input
  - [ ] Close on Esc and outside click

---

#### BENTO-102
- **Type**: Bug
- **Title**: Kanban card drag-and-drop breaks when column has WIP limit reached
- **Priority**: High
- **Severity**: Major
- **Story Points**: 3
- **Sprint**: S-05
- **Epic**: E-01
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 4
- **Labels**: `bug`, `frontend`, `dnd-kit`
- **Description**:
  When a board column has a WIP limit set (e.g., limit = 3, currently 3 cards) and a user drags a card into that column, the card snaps back but no error or visual feedback is shown. The backend correctly rejects the move, but the frontend silently reverts the optimistic update without notifying the user.

  **Steps to reproduce**:
  1. Create a column with WIP limit = 2
  2. Add 2 issues to that column
  3. Drag a third issue into the column
  4. Card snaps back — no feedback shown

  **Expected**: Toast notification "WIP limit reached for column 'In Progress' (2/2)"

- **Checklist**:
  - [ ] Detect WIP limit violation in `BoardColumn.tsx`
  - [ ] Show toast via `sonner`
  - [ ] Visual column highlight on violation
  - [ ] Write test case

---

#### BENTO-103
- **Type**: Task
- **Title**: Add RTL layout support across all pages (Hebrew locale)
- **Priority**: Medium
- **Story Points**: 5
- **Sprint**: S-05
- **Epic**: E-01
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 8
- **Labels**: `frontend`, `i18n`, `rtl`, `accessibility`
- **Description**:
  The app must support Hebrew (RTL) as a language. All layout components must use CSS logical properties instead of physical directional properties. Tailwind has `rtl:` and `ltr:` variants. The `dir` attribute must be set on `<html>` based on the active language.

  **Audit the following**:
  - Sidebar (`Sidebar.tsx`) — left-anchored layout must mirror to right in RTL
  - All `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-` usages → replace with `ms-`, `me-`, `ps-`, `pe-`
  - Avatar group, dropdown positions
  - Issue card layout
  - Modal positioning

- **Checklist**:
  - [ ] Audit all Tailwind directional classes
  - [ ] Replace with logical equivalents (`ms`, `me`, `ps`, `pe`)
  - [ ] Test Hebrew locale
  - [ ] Set `dir="rtl"` on `<html>` for RTL languages
  - [ ] Test Sidebar RTL
  - [ ] Test IssueCard RTL
  - [ ] Test Modals RTL

---

#### BENTO-104
- **Type**: Task
- **Title**: Complete Calendar page — render issues on due dates
- **Priority**: Medium
- **Story Points**: 5
- **Sprint**: S-05
- **Epic**: E-01
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 10
- **Labels**: `frontend`, `calendar`
- **Description**:
  `CalendarPage.tsx` is currently a skeleton with a grid layout. It needs to:
  - Fetch issues with `dueDate` within the current month view
  - Render issue chips on the correct day cells
  - Support month/week view toggle
  - Click on issue chip → open `IssueDetailPanel`
  - Navigate months with prev/next

---

#### BENTO-105
- **Type**: Task
- **Title**: Roadmap page — wire epics and milestones to real API data
- **Priority**: Medium
- **Story Points**: 5
- **Sprint**: S-05
- **Epic**: E-01
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 8
- **Labels**: `frontend`, `roadmap`, `epics`
- **Description**:
  `RoadmapPage.tsx` renders a timeline view. It needs to be connected to:
  - `GET /api/epics?boardId=` — list epics with start/end dates
  - `GET /api/milestones?boardId=` — list milestones
  - Render horizontal bars for epics (Gantt style)
  - Render vertical lines for milestone dates
  - Click on epic → open epic detail panel

---

#### BENTO-106
- **Type**: Task
- **Title**: Implement issue relations UI (blocks / depends-on / related-to)
- **Priority**: Low
- **Story Points**: 3
- **Sprint**: S-05
- **Epic**: E-01
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 6
- **Labels**: `frontend`, `issues`
- **Description**:
  The backend `IssueRelationController` supports `BLOCKS`, `DEPENDS_ON`, `RELATES_TO`, `DUPLICATES`. The `IssueDetailPanel` does not currently render these. Add a "Relations" section below the description that:
  - Lists related issues grouped by type
  - Allows adding a relation via search (select issue + relation type)
  - Allows removing a relation

---

#### BENTO-107
- **Type**: Bug
- **Title**: IssueDetailPanel — activity log does not refresh after adding a comment
- **Priority**: Medium
- **Severity**: Minor
- **Story Points**: 2
- **Sprint**: S-05
- **Epic**: E-01
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 2
- **Labels**: `bug`, `frontend`, `react-query`
- **Description**:
  After posting a comment in `IssueDetailPanel`, the comment appears in the comments list (optimistic update), but the activity log section does not refresh. The activity log query needs to be invalidated on successful comment creation.

  **Fix**: In `useCreateComment` mutation `onSuccess`, call `queryClient.invalidateQueries(['activity', issueId])`.

---

#### BENTO-108
- **Type**: Task
- **Title**: Bulk issue operations — select multiple, bulk assign / move / close
- **Priority**: Low
- **Story Points**: 5
- **Sprint**: S-05
- **Epic**: E-01
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 10
- **Labels**: `frontend`, `issues`, `ux`
- **Description**:
  Add checkbox selection to issue cards in the backlog list view. When multiple issues are selected, show a floating action bar at the bottom with:
  - Assign to (user picker)
  - Move to sprint (sprint picker)
  - Change priority
  - Close selected
  - Add label

---

### SPRINT S-06 — Test Coverage Sprint

---

#### BENTO-201
- **Type**: Task
- **Title**: Write unit tests for IssueService — all CRUD methods
- **Priority**: High
- **Story Points**: 5
- **Sprint**: S-06
- **Epic**: E-04
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 8
- **Labels**: `backend`, `tests`, `task-service`
- **Description**:
  `task-service` currently has minimal test coverage. Implement unit tests for `IssueService` covering:
  - `createIssue` — happy path, duplicate key conflict, invalid boardId
  - `updateIssue` — title update, priority change, assignee change
  - `moveIssue` — column change, WIP limit violation
  - `closeIssue` — sets `closed=true`, `closedAt` timestamp
  - `deleteIssue` — cascades to comments, time logs, relations
  - `searchIssues` — text search, filter by priority/type/assignee

  Use Mockito for repository mocking, JUnit 5.

---

#### BENTO-202
- **Type**: Task
- **Title**: Write integration tests for SprintService with Testcontainers (MongoDB)
- **Priority**: High
- **Story Points**: 5
- **Sprint**: S-06
- **Epic**: E-04
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 8
- **Labels**: `backend`, `tests`, `task-service`, `testcontainers`
- **Description**:
  Integration tests for `SprintService` using a real MongoDB instance via Testcontainers:
  - `createSprint` — persists correctly
  - `startSprint` — sets status to ACTIVE, cannot start second sprint on same board
  - `completeSprint` — moves incomplete issues to next sprint or backlog
  - `getSprint` — returns correct sprint with issue count
  - `deleteSprint` — only allowed when PLANNED status

---

#### BENTO-203
- **Type**: Task
- **Title**: Write unit tests for NotificationService — event routing
- **Priority**: Medium
- **Story Points**: 3
- **Sprint**: S-06
- **Epic**: E-04
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 5
- **Labels**: `backend`, `tests`, `notification-service`
- **Description**:
  Test that `NotificationService` correctly:
  - Routes `UserRegisteredEvent` → welcome email via `EmailService`
  - Routes `InvitationCreatedEvent` → invitation email
  - Routes `IssueAssignedEvent` → in-app + email notification for assignee
  - Routes `SprintEndingSoonEvent` → sends reminder to all board members
  - Does not send email if user has notification preference disabled
  - Persists `Notification` entity to MongoDB

---

#### BENTO-204
- **Type**: Task
- **Title**: Add frontend unit tests with Vitest — auth store, API hooks
- **Priority**: Medium
- **Story Points**: 5
- **Sprint**: S-06
- **Epic**: E-04
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 10
- **Labels**: `frontend`, `tests`, `vitest`
- **Description**:
  Set up Vitest + React Testing Library for the frontend. Write tests for:
  - `authStore` — login/logout state transitions
  - `useLogin` hook — success, 401 error, network error
  - `useCreateIssue` — optimistic update, rollback on failure
  - `IssueCard` component — renders priority icon, title, assignee avatar
  - `CreateIssueModal` — form validation, required fields

---

#### BENTO-205
- **Type**: Task
- **Title**: Write E2E tests with Playwright — critical user flows
- **Priority**: Medium
- **Story Points**: 8
- **Sprint**: S-06
- **Epic**: E-04
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 16
- **Labels**: `tests`, `e2e`, `playwright`
- **Description**:
  Set up Playwright E2E test suite targeting the full Docker Compose stack. Cover:

  **Flow 1 — Registration & Onboarding**:
  1. Register new user
  2. Receive verification email (MailHog API)
  3. Verify email token
  4. Create organization
  5. Create first board

  **Flow 2 — Issue Lifecycle**:
  1. Create issue (Bug, High priority)
  2. Assign to self
  3. Move to In Progress via drag
  4. Add comment
  5. Log time
  6. Close issue

  **Flow 3 — Sprint**:
  1. Create sprint
  2. Move issues from backlog
  3. Start sprint
  4. Complete sprint
  5. Verify incomplete issues moved to backlog

---

#### BENTO-206
- **Type**: Task
- **Title**: Add Testcontainers integration test for JwtAuthFilter in api-gateway
- **Priority**: High
- **Story Points**: 3
- **Sprint**: S-06
- **Epic**: E-04
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 5
- **Labels**: `backend`, `tests`, `api-gateway`, `security`
- **Description**:
  Test that `JwtAuthFilter` in the api-gateway correctly:
  - Passes valid JWT → forwards `X-User-Id`, `X-Org-Id` headers
  - Rejects expired JWT → 401
  - Rejects missing Authorization header → 401
  - Detects stale token (Redis key present, `iat` < stale timestamp) → 401 `TOKEN_STALE`
  - Allows public endpoints without JWT (`/api/auth/login`, `/api/auth/register`)

  Use Testcontainers Redis for the stale token tests.

---

#### BENTO-207
- **Type**: Task
- **Title**: Set up code coverage reporting with JaCoCo + minimum 70% threshold
- **Priority**: Medium
- **Story Points**: 2
- **Sprint**: S-06
- **Epic**: E-04
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 3
- **Labels**: `backend`, `ci`, `quality`
- **Description**:
  Configure JaCoCo in `build.gradle` to:
  - Generate coverage report on `./gradlew test`
  - Fail the build if line coverage < 70% for `auth-service`, `org-service`
  - Fail the build if line coverage < 50% for `task-service`, `board-service`
  - Output HTML report to `build/reports/jacoco/`

---

### SPRINT S-07 — CI/CD Sprint

---

#### BENTO-301
- **Type**: Task
- **Title**: Set up GitHub Actions workflow — test all backend services on PR
- **Priority**: Critical
- **Story Points**: 5
- **Sprint**: S-07
- **Epic**: E-05
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 8
- **Labels**: `ci-cd`, `github-actions`, `backend`
- **Description**:
  Create `.github/workflows/ci.yml` that runs on every push to `main` and every pull request:

  ```yaml
  name: CI
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      services:
        postgres: ...
        mongodb: ...
        redis: ...
      steps:
        - Checkout
        - Setup Java 25
        - Run ./gradlew test
        - Upload JaCoCo report as artifact
        - Comment coverage % on PR
  ```

  Must complete in under 10 minutes.

- **Checklist**:
  - [ ] Create `.github/workflows/ci.yml`
  - [ ] Configure service containers (Postgres, MongoDB, Redis)
  - [ ] Cache Gradle dependencies between runs
  - [ ] Upload test results as artifact
  - [ ] Upload JaCoCo HTML report
  - [ ] Fail PR if tests fail

---

#### BENTO-302
- **Type**: Task
- **Title**: Set up GitHub Actions workflow — build and push Docker images to ECR
- **Priority**: Critical
- **Story Points**: 8
- **Sprint**: S-07
- **Epic**: E-05
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 12
- **Labels**: `ci-cd`, `github-actions`, `docker`, `aws`
- **Description**:
  Create `.github/workflows/build.yml` that triggers on merge to `main`:

  1. Authenticate to AWS ECR with OIDC (no long-lived credentials)
  2. Build Docker image for each service using multi-stage Dockerfile
  3. Tag image with `git SHA` and `latest`
  4. Push to ECR repository per service (`bento/auth-service`, `bento/task-service`, etc.)
  5. Output image digests as job summary

  **Services**: api-gateway, auth-service, org-service, board-service, task-service, notification-service, realtime-service, attachment-service, frontend

  **Security**: Use GitHub OIDC → AWS IAM Role (no static AWS credentials in secrets).

- **Checklist**:
  - [ ] Create ECR repositories (via Terraform — see BENTO-401)
  - [ ] Configure GitHub OIDC provider in AWS
  - [ ] Create IAM role with ECR push permissions
  - [ ] Write build workflow
  - [ ] Build and push all 9 images
  - [ ] Tag with SHA + latest
  - [ ] Test workflow end-to-end

---

#### BENTO-303
- **Type**: Task
- **Title**: Set up GitHub Actions workflow — deploy to EKS on merge to main
- **Priority**: High
- **Story Points**: 8
- **Sprint**: S-07
- **Epic**: E-05
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 12
- **Labels**: `ci-cd`, `github-actions`, `kubernetes`, `aws`
- **Description**:
  Create `.github/workflows/deploy.yml` that runs after the build workflow succeeds:

  1. Authenticate to AWS (OIDC)
  2. Update kubeconfig for EKS cluster
  3. For each service: `kubectl set image deployment/bento-auth-service bento-auth-service=$ECR_URI:$SHA`
  4. Wait for rollout: `kubectl rollout status deployment/bento-auth-service --timeout=5m`
  5. Run smoke tests (curl health endpoints)
  6. Send Slack notification on success/failure

- **Checklist**:
  - [ ] Write deploy workflow
  - [ ] Configure kubectl for EKS
  - [ ] Rolling update per service
  - [ ] Rollout status check
  - [ ] Smoke test step
  - [ ] Failure notification

---

#### BENTO-304
- **Type**: Task
- **Title**: Add Docker image vulnerability scanning with Trivy in CI
- **Priority**: Medium
- **Story Points**: 2
- **Sprint**: S-07
- **Epic**: E-05
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 3
- **Labels**: `ci-cd`, `security`, `docker`
- **Description**:
  Add Trivy container scanning step to the build workflow. Fail the build if any `CRITICAL` severity CVE is detected. Upload SARIF report to GitHub Security tab.

---

#### BENTO-305
- **Type**: Task
- **Title**: Configure Dependabot for automated dependency updates
- **Priority**: Low
- **Story Points**: 1
- **Sprint**: S-07
- **Epic**: E-05
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 1
- **Labels**: `ci-cd`, `dependencies`
- **Description**:
  Create `.github/dependabot.yml` to auto-create PRs for:
  - Gradle dependencies (backend)
  - npm dependencies (frontend)
  - Docker base image updates
  - GitHub Actions version updates

  Configure to group patch updates into a single weekly PR.

---

### SPRINT S-08 — Kubernetes Sprint

---

#### BENTO-401
- **Type**: Task
- **Title**: Write Kubernetes Deployment + Service manifest for auth-service
- **Priority**: High
- **Story Points**: 3
- **Sprint**: S-08
- **Epic**: E-06
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 4
- **Labels**: `kubernetes`, `infra`
- **Description**:
  Create `infra/k8s/services/auth-service/deployment.yaml`:

  ```yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: bento-auth-service
    namespace: bento
  spec:
    replicas: 2
    selector:
      matchLabels:
        app: bento-auth-service
    template:
      spec:
        containers:
          - name: bento-auth-service
            image: <ECR_URI>/bento/auth-service:latest
            ports:
              - containerPort: 8081
            envFrom:
              - secretRef:
                  name: bento-secrets
              - configMapRef:
                  name: bento-config
            readinessProbe:
              httpGet:
                path: /actuator/health/readiness
                port: 8081
            livenessProbe:
              httpGet:
                path: /actuator/health/liveness
                port: 8081
            resources:
              requests:
                memory: "256Mi"
                cpu: "100m"
              limits:
                memory: "512Mi"
                cpu: "500m"
  ```

  Repeat the same pattern for all 8 microservices.

- **Checklist**:
  - [ ] auth-service deployment + service
  - [ ] org-service deployment + service
  - [ ] board-service deployment + service
  - [ ] task-service deployment + service
  - [ ] notification-service deployment + service
  - [ ] realtime-service deployment + service (WebSocket needs sticky sessions)
  - [ ] attachment-service deployment + service
  - [ ] api-gateway deployment + service (LoadBalancer type)
  - [ ] frontend deployment + service

---

#### BENTO-402
- **Type**: Task
- **Title**: Create Kubernetes ConfigMap and Secret manifests for all services
- **Priority**: High
- **Story Points**: 3
- **Sprint**: S-08
- **Epic**: E-06
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 4
- **Labels**: `kubernetes`, `infra`, `security`
- **Description**:
  Create `infra/k8s/config/`:
  - `bento-config.yaml` — ConfigMap with non-sensitive config (service URLs, Kafka brokers, MongoDB host, etc.)
  - `bento-secrets.yaml` — **template only** (actual values managed by AWS Secrets Manager + External Secrets Operator)

  All sensitive values (JWT_SECRET, GATEWAY_INTERNAL_SECRET, AUTH_PEPPER, DB passwords) must come from AWS Secrets Manager, not hardcoded in the repo.

---

#### BENTO-403
- **Type**: Task
- **Title**: Set up Kubernetes Ingress with TLS termination (cert-manager + Let's Encrypt)
- **Priority**: High
- **Story Points**: 5
- **Sprint**: S-08
- **Epic**: E-06
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 8
- **Labels**: `kubernetes`, `infra`, `tls`, `networking`
- **Description**:
  Configure:
  1. Install `nginx-ingress-controller` on EKS
  2. Install `cert-manager` for automatic TLS certificate provisioning
  3. Create `Ingress` resource routing:
     - `bento.io` → frontend
     - `api.bento.io` → api-gateway
     - `*.bento.io` → org subdomain routing → api-gateway
  4. Configure `ClusterIssuer` for Let's Encrypt (prod + staging)
  5. Annotate Ingress to auto-provision certificates

- **Checklist**:
  - [ ] Install nginx ingress controller via Helm
  - [ ] Install cert-manager via Helm
  - [ ] Configure ClusterIssuer (Let's Encrypt)
  - [ ] Create Ingress manifest
  - [ ] Wildcard subdomain TLS (`*.bento.io`)
  - [ ] Test HTTPS

---

#### BENTO-404
- **Type**: Task
- **Title**: Configure Horizontal Pod Autoscaler (HPA) for high-traffic services
- **Priority**: Medium
- **Story Points**: 3
- **Sprint**: S-08
- **Epic**: E-06
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 4
- **Labels**: `kubernetes`, `infra`, `scaling`
- **Description**:
  Create HPA resources for:
  - `api-gateway` — scale 2→10 pods, CPU threshold 60%
  - `task-service` — scale 1→5 pods, CPU threshold 70%
  - `notification-service` — scale 1→3 pods, CPU threshold 70%
  - `realtime-service` — scale 2→8 pods (sticky session requirement)

  Requires Metrics Server installed on EKS.

---

#### BENTO-405
- **Type**: Task
- **Title**: Create Kubernetes namespace, RBAC, and NetworkPolicy
- **Priority**: High
- **Story Points**: 3
- **Sprint**: S-08
- **Epic**: E-06
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 5
- **Labels**: `kubernetes`, `infra`, `security`
- **Description**:
  - Create `bento` namespace
  - Create `ServiceAccount` per service (principle of least privilege)
  - Create `NetworkPolicy` to restrict inter-service communication:
    - Services can only be reached via api-gateway from outside
    - Services can call each other via internal service DNS
    - Databases (RDS, ElastiCache) are not directly reachable from internet
  - Create RBAC roles for CI/CD (deploy role with limited permissions)

---

#### BENTO-406
- **Type**: Task
- **Title**: Write Helm chart for full Bento stack
- **Priority**: Medium
- **Story Points**: 8
- **Sprint**: S-08
- **Epic**: E-06
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 14
- **Labels**: `kubernetes`, `helm`, `infra`
- **Description**:
  Package all Kubernetes manifests as a Helm chart at `infra/helm/bento/`:
  - `Chart.yaml` — chart metadata
  - `values.yaml` — all configurable values (image tags, replicas, resource limits, feature flags)
  - `values-prod.yaml` — production overrides
  - `values-staging.yaml` — staging overrides
  - `templates/` — all manifests templated with `{{ .Values.xxx }}`

  Benefits: single command deploy (`helm upgrade --install bento ./infra/helm/bento`), environment-specific overrides, rollback support (`helm rollback bento 1`).

- **Checklist**:
  - [ ] Chart.yaml
  - [ ] values.yaml with all defaults
  - [ ] Template: deployments (all services)
  - [ ] Template: services
  - [ ] Template: ingress
  - [ ] Template: configmap
  - [ ] Template: hpa
  - [ ] values-prod.yaml
  - [ ] values-staging.yaml
  - [ ] Test install on local k3d

---

### SPRINT S-09 — AWS Infrastructure Sprint

---

#### BENTO-501
- **Type**: Task
- **Title**: Terraform — VPC with public/private subnets, NAT gateway, routing
- **Priority**: Critical
- **Story Points**: 5
- **Sprint**: S-09
- **Epic**: E-07
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 8
- **Labels**: `terraform`, `aws`, `networking`
- **Description**:
  Create `infra/terraform/modules/vpc/`:
  - VPC: `10.0.0.0/16`
  - 3 public subnets (one per AZ) — for ALB, NAT gateway
  - 3 private subnets (one per AZ) — for EKS worker nodes, RDS, ElastiCache
  - Internet Gateway → public subnets
  - NAT Gateway (one per AZ for HA) → private subnets
  - Route tables wired correctly
  - VPC Flow Logs to CloudWatch

- **Checklist**:
  - [ ] VPC resource
  - [ ] Public subnets (3)
  - [ ] Private subnets (3)
  - [ ] Internet gateway
  - [ ] NAT gateways
  - [ ] Route tables
  - [ ] VPC Flow Logs
  - [ ] Tag all resources

---

#### BENTO-502
- **Type**: Task
- **Title**: Terraform — EKS cluster with managed node groups
- **Priority**: Critical
- **Story Points**: 8
- **Sprint**: S-09
- **Epic**: E-07
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 12
- **Labels**: `terraform`, `aws`, `kubernetes`, `eks`
- **Description**:
  Create `infra/terraform/modules/eks/`:
  - EKS cluster (Kubernetes 1.31) in private subnets
  - Managed node group: `t3.medium` × 2 nodes (min 2, max 6)
  - EKS add-ons: CoreDNS, kube-proxy, VPC CNI, EBS CSI Driver
  - OIDC provider for service account → IAM role binding (IRSA)
  - Cluster logging to CloudWatch (API, audit, authenticator)
  - Security groups: control plane ↔ worker nodes only

- **Checklist**:
  - [ ] EKS cluster resource
  - [ ] Node group
  - [ ] OIDC provider
  - [ ] IAM roles (cluster + node + IRSA)
  - [ ] EKS add-ons
  - [ ] CloudWatch logging
  - [ ] Security groups
  - [ ] Outputs (cluster endpoint, kubeconfig, OIDC arn)

---

#### BENTO-503
- **Type**: Task
- **Title**: Terraform — RDS PostgreSQL (Multi-AZ) for auth/org/board services
- **Priority**: High
- **Story Points**: 5
- **Sprint**: S-09
- **Epic**: E-07
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 6
- **Labels**: `terraform`, `aws`, `database`, `postgresql`
- **Description**:
  Create `infra/terraform/modules/rds/`:
  - Engine: PostgreSQL 17
  - Instance: `db.t3.medium` (prod), `db.t3.micro` (staging)
  - Multi-AZ: enabled in production, disabled in staging
  - Storage: 20GB gp3, autoscaling up to 100GB
  - Subnet group: private subnets only
  - Security group: only allow port 5432 from EKS worker node security group
  - Automated backups: 7 days retention
  - Encryption at rest: enabled (AWS KMS)
  - Parameter group: optimized for connections (max_connections = 200)
  - 3 databases: `bento_auth`, `bento_org`, `bento_board`
  - Credentials → AWS Secrets Manager

---

#### BENTO-504
- **Type**: Task
- **Title**: Terraform — ElastiCache Redis cluster for caching and sessions
- **Priority**: High
- **Story Points**: 3
- **Sprint**: S-09
- **Epic**: E-07
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 4
- **Labels**: `terraform`, `aws`, `redis`
- **Description**:
  Create `infra/terraform/modules/elasticache/`:
  - Engine: Redis 7.x
  - Mode: Cluster mode disabled, replication group (1 primary, 1 replica)
  - Node type: `cache.t3.micro` (staging) / `cache.t3.small` (prod)
  - Multi-AZ: enabled in production
  - Subnet group: private subnets
  - Security group: port 6379 from EKS nodes only
  - At-rest encryption: enabled
  - In-transit encryption: enabled (TLS)
  - Auth token: managed via Secrets Manager

---

#### BENTO-505
- **Type**: Task
- **Title**: Terraform — S3 bucket for attachments with lifecycle policies
- **Priority**: High
- **Story Points**: 2
- **Sprint**: S-09
- **Epic**: E-07
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 3
- **Labels**: `terraform`, `aws`, `s3`
- **Description**:
  Create `infra/terraform/modules/s3/`:
  - Bucket: `bento-attachments-{env}` (unique per environment)
  - Block all public access
  - Versioning: enabled
  - Server-side encryption: SSE-S3 (AES-256)
  - Lifecycle rule: move to S3-IA after 30 days, Glacier after 90 days
  - CORS configuration for presigned URL uploads from browser
  - Bucket policy: only allow access from attachment-service IAM role (IRSA)

---

#### BENTO-506
- **Type**: Task
- **Title**: Terraform — DocumentDB (MongoDB-compatible) for task and notification services
- **Priority**: High
- **Story Points**: 5
- **Sprint**: S-09
- **Epic**: E-07
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 6
- **Labels**: `terraform`, `aws`, `mongodb`, `documentdb`
- **Description**:
  Create `infra/terraform/modules/documentdb/`:
  - Engine: DocumentDB 5.0 (MongoDB-compatible)
  - Cluster: 1 primary + 1 replica (prod) / 1 instance (staging)
  - Instance type: `db.t3.medium`
  - Subnet group: private subnets
  - Security group: port 27017 from EKS nodes only
  - TLS required
  - Backup: 7 days retention
  - Credentials → Secrets Manager

  **Note**: Update `spring.mongodb.*` connection string in services to use DocumentDB endpoint.

---

#### BENTO-507
- **Type**: Task
- **Title**: Terraform — MSK (Managed Kafka) for event streaming
- **Priority**: High
- **Story Points**: 5
- **Sprint**: S-09
- **Epic**: E-07
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 8
- **Labels**: `terraform`, `aws`, `kafka`, `msk`
- **Description**:
  Create `infra/terraform/modules/msk/`:
  - Engine: Kafka 3.9 (KRaft mode)
  - Brokers: 2 × `kafka.t3.small` across 2 AZs (prod), 1 × `kafka.t3.small` (staging)
  - Storage: 100GB per broker, autoscaling enabled
  - Security: TLS encryption, SASL/SCRAM authentication
  - Subnet group: private subnets
  - Security group: port 9092/9094 from EKS nodes only
  - CloudWatch metrics: enabled
  - Auto-create topics: enabled (for dev), disabled (prod)

---

#### BENTO-508
- **Type**: Task
- **Title**: Terraform — AWS Secrets Manager + External Secrets Operator integration
- **Priority**: Critical
- **Story Points**: 3
- **Sprint**: S-09
- **Epic**: E-07
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 5
- **Labels**: `terraform`, `aws`, `security`, `kubernetes`
- **Description**:
  Store all sensitive credentials in AWS Secrets Manager:
  - `bento/{env}/db/postgres` — RDS credentials
  - `bento/{env}/db/mongo` — DocumentDB credentials
  - `bento/{env}/redis/auth-token` — ElastiCache auth token
  - `bento/{env}/app/jwt-secret` — JWT signing secret
  - `bento/{env}/app/gateway-secret` — Internal secret
  - `bento/{env}/app/auth-pepper` — Password pepper

  Install External Secrets Operator (ESO) on EKS cluster. Create `ExternalSecret` resources that pull from Secrets Manager and create Kubernetes `Secret` objects automatically.

---

### SPRINT S-10 — Production Launch Sprint

---

#### BENTO-601
- **Type**: Task
- **Title**: Set up Prometheus + Grafana on EKS for service metrics
- **Priority**: High
- **Story Points**: 5
- **Sprint**: S-10
- **Epic**: E-09
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 8
- **Labels**: `monitoring`, `kubernetes`, `observability`
- **Description**:
  Deploy the `kube-prometheus-stack` Helm chart to the `monitoring` namespace:
  - Prometheus scrapes `/actuator/prometheus` on all Spring Boot services (enable Micrometer)
  - Grafana dashboards:
    - JVM metrics (heap, GC, threads)
    - HTTP request rate, latency (P50/P95/P99)
    - Kafka consumer lag per service
    - WebSocket connection count (realtime-service)
    - Error rate per service
  - AlertManager rules:
    - Service down → PagerDuty
    - Error rate > 5% → Slack
    - Kafka lag > 1000 → Slack
  - Persistent storage for Prometheus (EBS CSI Driver)

- **Checklist**:
  - [ ] Add `spring-boot-starter-actuator` to all services
  - [ ] Add `micrometer-registry-prometheus` dependency
  - [ ] Expose `/actuator/prometheus` endpoint
  - [ ] Deploy kube-prometheus-stack
  - [ ] Configure scrape targets
  - [ ] Import Grafana dashboards
  - [ ] Configure AlertManager

---

#### BENTO-602
- **Type**: Task
- **Title**: Set up distributed tracing with OpenTelemetry + Jaeger
- **Priority**: Medium
- **Story Points**: 5
- **Sprint**: S-10
- **Epic**: E-09
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 8
- **Labels**: `monitoring`, `observability`, `tracing`
- **Description**:
  Add OpenTelemetry auto-instrumentation to all Spring Boot services:
  - Add `opentelemetry-spring-boot-starter` dependency
  - Configure OTLP exporter → Jaeger (deployed on EKS)
  - Trace context propagated via HTTP headers (`traceparent`) across service calls
  - Kafka message headers carry trace context
  - Jaeger UI accessible at `tracing.internal.bento.io`

  End result: a single API request from frontend can be traced across api-gateway → auth-service → org-service with latency breakdown.

---

#### BENTO-603
- **Type**: Task
- **Title**: Set up Loki + Promtail for log aggregation across all pods
- **Priority**: Medium
- **Story Points**: 3
- **Sprint**: S-10
- **Epic**: E-09
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 5
- **Labels**: `monitoring`, `observability`, `logging`
- **Description**:
  Deploy Loki + Promtail via Helm:
  - Promtail runs as DaemonSet on all nodes, ships pod logs to Loki
  - Loki stores logs in S3 (cost-effective at scale)
  - Grafana Loki datasource configured
  - Log correlation with Prometheus (trace ID in log lines → jump to Jaeger)
  - Retention: 30 days

---

#### BENTO-604
- **Type**: Bug
- **Title**: task-service — IssueAssignedEvent not published on assignment
- **Priority**: Critical
- **Severity**: Critical
- **Story Points**: 3
- **Sprint**: S-10
- **Epic**: E-03
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 3
- **Labels**: `bug`, `backend`, `task-service`, `kafka`
- **Description**:
  `IssueEventPublisher` is defined in task-service, and `IssueAssignedEvent` exists in `kafka-events` lib. However, `IssueService.assignIssue()` does not call `issueEventPublisher.publishIssueAssigned()`.

  As a result, `notification-service` never receives the event and the assignee is not notified.

  **Fix**: In `IssueService.assignIssue()`, after saving the updated issue, call `issueEventPublisher.publishIssueAssigned(issue, previousAssigneeId)`.

  Same issue exists for:
  - `IssueCommentedEvent` — not published after comment creation
  - `IssueStatusChangedEvent` — not published after column move
  - `SprintStartedEvent` — not published after sprint start
  - `SprintCompletedEvent` — not published after sprint complete

---

#### BENTO-605
- **Type**: Task
- **Title**: Wire notification-service to consume IssueAssigned and IssueCommented events
- **Priority**: High
- **Story Points**: 5
- **Sprint**: S-10
- **Epic**: E-03
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 8
- **Labels**: `backend`, `notification-service`, `kafka`
- **Description**:
  After BENTO-604 is fixed, wire the notification-service `IssueEventConsumer` to handle:

  - `IssueAssignedEvent`:
    1. Create in-app `Notification` for assignee (type: `ISSUE_ASSIGNED`, title: "You were assigned to TF-42")
    2. Send email if user has email notifications enabled
    3. Skip if assignee == reporter (self-assign)

  - `IssueCommentedEvent`:
    1. Create in-app `Notification` for all watchers + issue reporter (except commenter)
    2. Send email digest (not one email per comment — batch within 5 minutes)

  - `SprintStartedEvent`:
    1. Create in-app `Notification` for all board members
    2. Send Slack message to board webhook if configured

---

#### BENTO-606
- **Type**: Task
- **Title**: Database migration strategy — add Flyway to all PostgreSQL services
- **Priority**: High
- **Story Points**: 5
- **Sprint**: S-10
- **Epic**: E-08
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 8
- **Labels**: `backend`, `database`, `migrations`
- **Description**:
  Add Flyway to `auth-service`, `org-service`, `board-service` so database schema migrations are version-controlled and reproducible:
  - Add `flyway-core` dependency
  - Move all `spring.jpa.hibernate.ddl-auto=create` to `validate`
  - Write initial migration scripts (`V1__initial_schema.sql`) from current entity definitions
  - Write migration script template for future changes
  - Test: dropping the DB and running migrations recreates it correctly

  **Why**: Without Flyway, production schema changes require manual DDL execution. This has caused data loss incidents at other projects.

---

#### BENTO-607
- **Type**: Task
- **Title**: Implement rate limiting per user per endpoint in api-gateway
- **Priority**: High
- **Story Points**: 5
- **Sprint**: S-10
- **Epic**: E-08
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 8
- **Labels**: `backend`, `api-gateway`, `security`, `rate-limiting`
- **Description**:
  The api-gateway has a rate limiting framework in place but limits are not enforced. Implement per-user rate limiting using Redis:

  | Endpoint Pattern | Limit |
  |---|---|
  | `POST /api/auth/login` | 10 req/min per IP |
  | `POST /api/auth/register` | 5 req/min per IP |
  | `POST /api/auth/forgot-password` | 3 req/min per IP |
  | `GET /api/**` | 300 req/min per user |
  | `POST /api/**` | 100 req/min per user |
  | `POST /api/attachments` | 20 req/min per user |

  Return HTTP 429 with `Retry-After` header and JSON body `{"error": "RATE_LIMIT_EXCEEDED"}`.

---

#### BENTO-608
- **Type**: Task
- **Title**: Add Spring Boot Actuator health checks + readiness/liveness probes
- **Priority**: High
- **Story Points**: 3
- **Sprint**: S-10
- **Epic**: E-08
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 4
- **Labels**: `backend`, `kubernetes`, `health`
- **Description**:
  All services must expose:
  - `GET /actuator/health/liveness` → Kubernetes liveness probe
  - `GET /actuator/health/readiness` → Kubernetes readiness probe (checks DB + Kafka connectivity)
  - `GET /actuator/health` → full health check (internal only)
  - `GET /actuator/info` → service version, git commit

  Configure in `application.yml`:
  ```yaml
  management:
    endpoint:
      health:
        probes:
          enabled: true
        show-details: when-authorized
    endpoints:
      web:
        exposure:
          include: health,info,prometheus
  ```

---

### SPRINT S-11 — Integrations Sprint

---

#### BENTO-701
- **Type**: Story
- **Title**: GitHub integration — link PRs and commits to issues
- **Priority**: Medium
- **Story Points**: 13
- **Sprint**: S-11
- **Epic**: E-11
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 20
- **Labels**: `integrations`, `github`
- **Description**:
  Allow organizations to connect their GitHub account. Once connected:
  - GitHub commits mentioning issue key (e.g. "fix: resolve TF-42 auth bug") automatically link to the issue
  - Issue detail shows linked PRs and commits
  - Closing a PR with `Closes BENTO-42` automatically closes the issue
  - Issue sidebar shows CI status of linked PR (passing/failing)

  **Implementation**:
  1. GitHub App (not OAuth) — install on org's GitHub account
  2. Webhook receiver endpoint in a new `integration-service` or within `notification-service`
  3. Parse commit messages and PR bodies for issue keys
  4. Store links in MongoDB
  5. Display in issue detail panel

---

#### BENTO-702
- **Type**: Story
- **Title**: Slack integration — send board notifications to Slack channel
- **Priority**: Medium
- **Story Points**: 8
- **Sprint**: S-11
- **Epic**: E-11
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 12
- **Labels**: `integrations`, `slack`
- **Description**:
  Board-level Slack integration:
  - Configure per board: Slack webhook URL + events to subscribe to
  - Events: sprint started, sprint completed, issue blocked, daily standup digest
  - Message format: rich Slack blocks with issue key, title, assignee, priority
  - Test message button in settings UI

---

#### BENTO-703
- **Type**: Story
- **Title**: Add Google OAuth login option
- **Priority**: Medium
- **Story Points**: 8
- **Sprint**: S-11
- **Epic**: E-10
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 12
- **Labels**: `backend`, `frontend`, `oauth`, `auth`
- **Description**:
  Add "Sign in with Google" on the login and register pages:
  - Backend: Spring Security OAuth2 client integration in auth-service
  - On first login: create user account, send welcome email, prompt to create org
  - On subsequent logins: log in, issue JWT, redirect to app
  - Link Google account to existing email/password account in profile settings

---

#### BENTO-704
- **Type**: Story
- **Title**: Implement TOTP two-factor authentication (2FA)
- **Priority**: High
- **Story Points**: 8
- **Sprint**: S-11
- **Epic**: E-10
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 14
- **Labels**: `backend`, `frontend`, `security`, `auth`
- **Description**:
  Add TOTP-based 2FA (compatible with Google Authenticator, Authy):

  **Setup flow**:
  1. User goes to Security settings → Enable 2FA
  2. Backend generates TOTP secret, returns QR code
  3. User scans QR code with authenticator app
  4. User enters 6-digit code to verify setup
  5. Backend stores secret (encrypted), marks 2FA enabled
  6. Show 10 recovery codes (one-time use)

  **Login flow**:
  1. User enters email + password → 200 with `{"requiresMfa": true, "mfaToken": "..."}`
  2. Frontend shows 2FA code input
  3. User enters 6-digit TOTP code → exchanges for JWT

  **Backend**: Use `dev.samstevens.totp` library for TOTP generation/verification.

---

---

### SPRINT S-11 — Integrations Sprint (continued)

---

#### BENTO-705
- **Type**: Task
- **Title**: Implement webhooks system — outbound HTTP calls on issue events
- **Priority**: Medium
- **Story Points**: 8
- **Sprint**: S-11
- **Epic**: E-11
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 14
- **Labels**: `backend`, `integrations`
- **Description**:
  Allow organizations to register webhook endpoints that receive HTTP POST calls on events:

  **Supported events**: `issue.created`, `issue.updated`, `issue.closed`, `issue.assigned`, `sprint.started`, `sprint.completed`, `member.invited`, `member.removed`

  **Implementation**:
  - New table in board-service DB: `webhooks` (id, orgId, boardId, url, secret, events[], isActive, createdAt)
  - Webhook delivery service: HTTP POST to registered URL with HMAC-SHA256 signature header (`X-Bento-Signature`)
  - Retry logic: 3 attempts with exponential backoff (1m, 5m, 30m)
  - Delivery log (last 50 deliveries per webhook, with response status)
  - UI in Integrations settings page: add/edit/delete webhooks, test delivery, view delivery log

  **Payload format**:
  ```json
  {
    "event": "issue.assigned",
    "timestamp": "2026-05-01T12:00:00Z",
    "orgId": "...",
    "boardId": "...",
    "data": { /* event-specific payload */ }
  }
  ```

---

#### BENTO-706
- **Type**: Task
- **Title**: Implement API key authentication for external integrations
- **Priority**: Medium
- **Story Points**: 5
- **Sprint**: S-11
- **Epic**: E-11
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 8
- **Labels**: `backend`, `security`, `integrations`
- **Description**:
  Allow organizations to generate API keys to authenticate external scripts and CI/CD pipelines without using user JWT tokens:

  - New table in auth-service: `api_keys` (id, orgId, userId, name, keyHash, lastUsedAt, expiresAt, scopes[], createdAt)
  - Key is shown once on creation (prefix + random, hashed in DB — like GitHub tokens)
  - api-gateway: detect `Authorization: ApiKey bento_key_...` → validate against DB → forward user+org context headers
  - Scopes: `issues:read`, `issues:write`, `sprints:read`, `sprints:write`
  - UI in Security settings: generate key (name + scopes + optional expiry), list keys, revoke key

---

#### BENTO-707
- **Type**: Task
- **Title**: Discord integration — send sprint and issue notifications to a Discord server
- **Priority**: Low
- **Story Points**: 5
- **Sprint**: S-11
- **Epic**: E-11
- **Status**: Open
- **Assignee**: andreibel
- **Estimated Hours**: 8
- **Labels**: `integrations`
- **Description**:
  Board-level Discord integration using Discord Webhooks (no OAuth needed):
  - Org settings → Integrations → Discord: paste webhook URL
  - Subscribe to: sprint started/completed, issue blocked, daily digest (9am org timezone)
  - Message format: Discord Embed with color per event type, issue link, assignee
  - Test message button
  - The `Organization.settings.allowDiscord` flag must be `true` (controlled by org plan)

---

---

## Advanced Features Icebox (E-12 — No Sprint)

> These issues are planned for v1.1+ or when core product is stable. No sprint assignment yet.

---

#### BENTO-801
- **Type**: Story
- **Title**: Workflow automation engine — triggers and actions
- **Priority**: Low
- **Story Points**: 21
- **Epic**: E-12
- **Status**: Open
- **Labels**: `backend`, `frontend`
- **Description**:
  Build a rule-based automation engine. The `AutomationsPage.tsx` placeholder exists — implement the full feature:

  **Trigger types**:
  - Issue created
  - Issue moved to column X
  - Issue assigned to user X
  - Issue priority changed to Critical
  - Sprint started
  - Due date is today

  **Action types**:
  - Assign issue to user X
  - Move issue to column X
  - Add label X
  - Set priority to X
  - Post comment "Automated: ..."
  - Send notification to user X
  - Trigger webhook

  **Backend**: Store rules in board-service DB (`automations` table). `AutomationEvaluator` service subscribes to all issue/sprint Kafka events, evaluates applicable rules, executes actions.

  **Frontend**: Rule builder UI with trigger/condition/action dropdowns. Enable/disable toggle per rule. Run history (last 20 executions).

---

#### BENTO-802
- **Type**: Story
- **Title**: Custom fields — extend issues with org-defined field types
- **Priority**: Low
- **Story Points**: 13
- **Epic**: E-12
- **Status**: Open
- **Labels**: `backend`, `frontend`
- **Description**:
  Allow organizations to define custom fields per board:

  **Field types**: Text, Number, Dropdown (single/multi), Date, Checkbox, URL, User reference

  **Backend**:
  - `CustomFieldDefinition` entity (boardId, name, type, options[], required, position)
  - `Issue` gets `customFields: Map<String, Object>` (already in MongoDB — schema-flexible)
  - API: CRUD for field definitions, validation of custom field values on issue save

  **Frontend**:
  - Board settings → Custom Fields tab: add/edit/delete fields
  - Issue create/edit forms: render custom field inputs based on definitions
  - Backlog and board view: show custom field value in card (configurable)
  - Filter by custom field value

---

#### BENTO-803
- **Type**: Story
- **Title**: Data export — CSV and JSON export for issues, time logs, sprint reports
- **Priority**: Low
- **Story Points**: 5
- **Epic**: E-12
- **Status**: Open
- **Labels**: `backend`, `frontend`
- **Description**:
  Export functionality from the Reports page:

  **Export types**:
  - Issues list (filtered or all): CSV with all fields
  - Time tracking report: CSV with user, issue, hours, date
  - Sprint report: PDF summary (velocity, burndown, completed/incomplete issues)

  **Backend**: Async generation for large exports — trigger export → Kafka message → task-service generates file → uploads to S3 → sends download link via notification.

  **Frontend**: Export button with format selector. Progress indicator. Download link when ready.

---

#### BENTO-804
- **Type**: Story
- **Title**: Board templates — pre-configured column sets for common workflows
- **Priority**: Low
- **Story Points**: 5
- **Epic**: E-12
- **Status**: Open
- **Labels**: `frontend`, `backend`
- **Description**:
  When creating a board, offer template selection:

  | Template | Columns |
  |---|---|
  | Basic Kanban | To Do → In Progress → Done |
  | Software Dev | Backlog → Selected → In Progress → Review → Testing → Done |
  | Bug Tracker | New → Triaged → In Progress → Fixed → Verified → Closed |
  | Marketing | Ideas → Approved → In Progress → Review → Published |
  | Custom | Start from scratch |

  Backend: seed `BoardColumnTemplate` records per template type. On board create, copy column definitions from template.

---

#### BENTO-805
- **Type**: Story
- **Title**: Audit log — track all org-level actions with actor, timestamp, before/after
- **Priority**: Medium
- **Story Points**: 8
- **Epic**: E-12
- **Status**: Open
- **Labels**: `backend`, `frontend`, `security`
- **Description**:
  Organization-wide audit log visible to OWNER and ADMIN:

  **Events tracked**:
  - Member invited/joined/removed/role changed
  - Board created/deleted
  - Issue deleted
  - API key created/revoked
  - Org settings changed
  - Integration added/removed
  - Login from new device

  **Backend**: `AuditLog` MongoDB collection (actor, orgId, action, resourceType, resourceId, before, after, ip, userAgent, timestamp). Populated via Kafka events + direct service calls.

  **Frontend**: Settings → Audit Log page. Filterable by event type, actor, date range. Export to CSV.

---

#### BENTO-806
- **Type**: Story
- **Title**: Mobile-responsive design pass — all pages usable on phone
- **Priority**: Medium
- **Story Points**: 8
- **Epic**: E-12
- **Status**: Open
- **Labels**: `frontend`, `accessibility`
- **Description**:
  Full responsive audit of all 32 pages for mobile (375px width):

  **Known breakage points**:
  - Sidebar: must collapse to hamburger menu on mobile
  - Kanban board: horizontal scroll with touch-friendly cards
  - Issue detail panel: full-screen on mobile (not slide-over)
  - Data tables (Members, Time Tracking): must stack or scroll horizontally
  - Modals: full-screen bottom sheet on mobile

  **Target**: Fully usable on iPhone 14 / Samsung Galaxy S23. Not a native app — just responsive web.

---

#### BENTO-807
- **Type**: Story
- **Title**: Implement sprint retrospective — structured board with feedback columns
- **Priority**: Low
- **Story Points**: 5
- **Epic**: E-12
- **Status**: Open
- **Labels**: `backend`, `frontend`
- **Description**:
  After completing a sprint, offer a structured retrospective:

  **Retrospective columns** (configurable): Went Well | Needs Improvement | Action Items | Kudos

  **Backend**: `Retrospective` embedded in `Sprint` (already in entity — needs API surface). Cards stored as `RetroCard[]` (id, column, text, authorId, votes).

  **Frontend**: Dedicated retro page per sprint. Add cards anonymously or with name. Vote on cards (👍). Facilitate session (facilitator reveals cards one at a time). Export retro summary.

---

## Bugs Backlog (No Sprint Assigned)

---

#### BENTO-901
- **Type**: Bug
- **Title**: board-service — BoardDeletedEvent published but not consumed by task-service
- **Priority**: High
- **Severity**: Major
- **Story Points**: 3
- **Epic**: E-03
- **Status**: Open
- **Labels**: `bug`, `backend`, `board-service`, `task-service`, `kafka`
- **Description**:
  When a board is deleted, `BoardDeletedEvent` is published to `bento.board.events`. However, task-service has no Kafka consumer for this topic. This means:
  - Issues belonging to the deleted board remain in MongoDB (orphaned)
  - Sprints belonging to the deleted board remain (orphaned)
  - MongoDB will fill with dead data over time

  **Fix**: Add `BoardEventConsumer` in task-service that handles `BoardDeletedEvent` → delete all issues, sprints, epics, milestones for that `boardId`.

---

#### BENTO-902
- **Type**: Bug
- **Title**: Invite acceptance fails silently when invitation token is expired
- **Priority**: Medium
- **Severity**: Minor
- **Story Points**: 2
- **Epic**: E-01
- **Status**: Open
- **Labels**: `bug`, `backend`, `org-service`, `frontend`
- **Description**:
  When a user clicks an expired invitation link:
  - Backend correctly returns `400 INVITATION_EXPIRED`
  - Frontend `InviteAcceptPage.tsx` does not handle this error code — shows a generic error or blank screen

  **Fix**: Add `INVITATION_EXPIRED` error handling in `InviteAcceptPage.tsx`. Show a friendly message with a "Request a new invitation" link.

---

#### BENTO-903
- **Type**: Bug
- **Title**: realtime-service — WebSocket reconnection after network drop not handled in frontend
- **Priority**: Medium
- **Severity**: Major
- **Story Points**: 3
- **Epic**: E-02
- **Status**: Open
- **Labels**: `bug`, `frontend`, `websocket`, `realtime`
- **Description**:
  When the user's network drops and recovers, the STOMP WebSocket client does not automatically reconnect. The board freezes with stale real-time data until a page refresh.

  **Fix**: Configure `@stomp/stompjs` `reconnectDelay` (exponential backoff). On reconnect, re-subscribe to all topics and invalidate React Query cache to force a data refresh.

---

#### BENTO-904
- **Type**: Bug
- **Title**: attachment-service — presigned URL expires too quickly for large file uploads
- **Priority**: Low
- **Severity**: Minor
- **Story Points**: 2
- **Epic**: E-08
- **Status**: Open
- **Labels**: `bug`, `backend`, `attachment-service`, `s3`
- **Description**:
  The presigned URL for file upload has a hardcoded 5-minute expiry. Users uploading large files (>100MB) over slow connections encounter upload failures as the URL expires mid-upload.

  **Fix**: Increase presigned URL TTL to 60 minutes for upload URLs. (Download URLs keep 5-minute TTL for security.)

---

#### BENTO-905
- **Type**: Bug
- **Title**: Sprint burndown chart shows flat line — data aggregation not implemented
- **Priority**: Medium
- **Severity**: Minor
- **Story Points**: 5
- **Epic**: E-01
- **Status**: Open
- **Labels**: `bug`, `frontend`, `backend`, `analytics`
- **Description**:
  The `SprintsPage.tsx` burndown chart renders a Recharts `LineChart` but the data is hardcoded or empty. Actual burndown data requires aggregating the number of open story points per day since sprint start.

  **Backend fix**: Add `GET /api/sprints/{id}/burndown` endpoint in task-service that returns `[{date, openPoints, idealPoints}]` by querying issue `columnHistory` to reconstruct historical state.

  **Frontend fix**: Wire `useSprintBurndown(sprintId)` hook to the chart component.

---

## Labels Reference

| Name | Color | Description |
|---|---|---|
| `bug` | `#ef4444` | Something broken |
| `frontend` | `#3b82f6` | Frontend / React |
| `backend` | `#8b5cf6` | Backend / Spring Boot |
| `api-gateway` | `#6366f1` | API Gateway service |
| `auth` | `#f59e0b` | Authentication related |
| `ci-cd` | `#10b981` | CI/CD pipelines |
| `kubernetes` | `#0ea5e9` | Kubernetes manifests |
| `terraform` | `#7c3aed` | Infrastructure as code |
| `aws` | `#f97316` | AWS cloud services |
| `kafka` | `#84cc16` | Kafka event streaming |
| `websocket` | `#06b6d4` | Real-time / WebSocket |
| `security` | `#dc2626` | Security issues |
| `tests` | `#16a34a` | Test coverage |
| `monitoring` | `#64748b` | Observability / metrics |
| `performance` | `#f59e0b` | Performance issues |
| `accessibility` | `#a21caf` | Accessibility / WCAG |
| `i18n` | `#0891b2` | Internationalization |
| `database` | `#b45309` | Database / migrations |
| `integrations` | `#0d9488` | Third-party integrations |
| `ux` | `#7c3aed` | User experience |

---

## Column Setup (Scrum board for BENTO project)

| Position | Name | WIP Limit | Color |
|---|---|---|---|
| 1 | Backlog | — | `#64748b` |
| 2 | Selected for Development | 10 | `#3b82f6` |
| 3 | In Progress | 5 | `#f59e0b` |
| 4 | In Review | 4 | `#8b5cf6` |
| 5 | Testing | 3 | `#06b6d4` |
| 6 | Done | — | `#10b981` |
| 7 | Blocked | — | `#ef4444` |

---

## Members

| User | Role | Responsibilities |
|---|---|---|
| andreibel | OWNER | Full-stack, architecture, infrastructure |

---

## Story Point Scale

| Points | Complexity | Example |
|---|---|---|
| 1 | Trivial | Fix a typo, add a missing null check |
| 2 | Small | Bug fix with clear root cause |
| 3 | Medium-small | Single endpoint, single component |
| 5 | Medium | Full feature slice (backend + frontend) |
| 8 | Large | Complex feature, multiple services |
| 13 | Very large | New service or major refactor |

---

## Sprint Velocity Target

| Metric | Value |
|---|---|
| Sprint duration | 14 days |
| Team size | 1 developer |
| Target velocity | 20–30 story points / sprint |
| Buffer | 20% for bugs and unplanned work |

---

## Full Issue Count by Status

| Sprint | Issues | Points | Status |
|---|---|---|---|
| S-01 Foundation | 8 | 39 | ✅ Completed |
| S-02 Board & Issues | 7 | 44 | ✅ Completed |
| S-03 Sprint & Epic | 6 | 32 | ✅ Completed |
| S-04 Real-time & Notifications | 5 | 28 | ✅ Completed |
| S-05 UI Polish | 8 | 36 | 🔲 Active |
| S-06 Test Coverage | 7 | 31 | 🔲 Planned |
| S-07 CI/CD | 5 | 24 | 🔲 Planned |
| S-08 Kubernetes | 6 | 25 | 🔲 Planned |
| S-09 AWS Infra | 8 | 36 | 🔲 Planned |
| S-10 Production Launch | 8 | 34 | 🔲 Planned |
| S-11 Integrations | 7 | 47 | 🔲 Planned |
| Icebox (E-12) | 7 | 65 | 🔲 Future |
| Bugs backlog | 5 | 15 | 🔲 Ongoing |
| **Total** | **87** | **456** | |

---

## Key Decisions Log

| Date | Decision | Reason |
|---|---|---|
| 2026-02-01 | Gradle multi-project build for all services | Single build cache, shared libs, one `./gradlew build` |
| 2026-02-01 | MongoDB for task-service (issues, sprints) | Schema-flexible for custom fields and embedded docs |
| 2026-02-01 | PostgreSQL for auth/org/board | Relational integrity needed for users, members, invitations |
| 2026-02-01 | Kafka for inter-service events | Decoupled services, replay capability, stale token detection |
| 2026-02-15 | dnd-kit for Kanban drag-and-drop | Actively maintained, React 19 compatible, accessible |
| 2026-03-01 | STOMP over raw WebSocket | Built-in topic subscriptions, Spring integration, reconnect support |
| 2026-03-15 | GitHub Actions over GitLab CI | Project is on GitHub, OIDC with AWS is native |
| 2026-04-01 | Helm chart over raw kubectl manifests | Environment-specific overrides, rollback via `helm rollback` |
| 2026-04-01 | Skip Elasticsearch | MongoDB full-text search sufficient at portfolio scale; ES adds 512MB+ overhead |
| 2026-04-01 | External Secrets Operator over hardcoded secrets | Secrets pulled from AWS Secrets Manager at pod start, never in git |