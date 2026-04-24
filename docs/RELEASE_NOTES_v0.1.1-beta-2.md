# Bento v0.1.1-beta-3-hotfix — First Beta Release

> This is the first public beta of Bento. Everything listed here is live, self-hostable, and ships as a single `docker compose up` command.

---

## What is Bento?

Bento is an open-source project management system you can run on your own server — from a Raspberry Pi to AWS. It supports Scrum and Kanban workflows, real-time collaboration, full Hebrew/English localization, and a full microservices backend built on Spring Boot 4 and Java 25.

---

## Highlights

### Boards — Kanban & Scrum

Full drag-and-drop Kanban and Scrum boards. Create any number of boards per organization, define custom columns, and move issues between them. Pull issues from the backlog directly onto the board. Board membership lets you control who sees what.

### Sprints

Plan, start, and complete sprints. Move issues in and out of a sprint, track sprint health in real time, and close a sprint with a summary of completed vs. carried-over work.

### Timeline — Gantt Chart

A full Gantt-style timeline view showing every issue with a start and due date. Visualize overlaps, dependencies, and epic progress across the entire project at a glance.

### Real-Time Collaboration

Every board updates live — no refresh needed. When a teammate moves a card, creates an issue, or changes a status, you see it immediately. Presence indicators show who else is on the board right now. Built on WebSocket/STOMP, it works across the whole team simultaneously — the same way collaborative document editors work, applied to your project board.

### Issue Tracking

Rich issue management with:
- Title, description (Markdown + task lists), priority, status
- Assignee, labels, epic, milestone, sprint
- Story points, start date, due date
- File attachments
- Parent/child issue relationships and dependencies
- Full comment thread with activity log
- Time tracking

### Backlog

A dedicated backlog view separate from the board. Drag issues into priority order, bulk-assign to sprints, or pull them onto the board when the team is ready.

### Full-Text Search

Search across all issues and comments in your organization instantly. Results update as you type.

### Command Palette

Hit a keyboard shortcut from anywhere in the app to jump to any board, issue, or setting without touching the mouse.

---

## Dashboard & Analytics

A summary dashboard with **15 live widgets**:

| Widget | What it shows |
|---|---|
| Sprint Health | Completion rate and remaining work for the active sprint |
| Velocity | Story points completed per sprint over time |
| Issue Breakdown | Open vs. closed by type |
| Priority Breakdown | Distribution of issues by priority |
| Open / Closed | Trend over time |
| Epic Progress | Per-epic completion percentage |
| Bug Rate | Bug issues as a share of total work |
| Cycle Time | Average time from start to done |
| WIP | Work in progress count vs. WIP limits |
| Overdue | Issues past their due date |
| Stale Issues | Issues with no activity in 14+ days |
| Unassigned | Issues with no owner |
| Team Activity | Per-member contribution over time |
| Workload | Open issue count per assignee |
| Recent Activity | Live feed of changes across all boards |

---

## Planning

- **Roadmap** — epic-level view across time
- **Sprints** — manage all sprints across boards from one place
- **Workload** — see how work is distributed across the team before assigning

---

## Settings

### Organization
- General settings — org name, logo upload with crop tool
- Members — invite by email, manage roles (Owner, Admin, Member), remove members
- Labels — create and manage labels with custom colors, used across all boards
- Advanced — danger zone (delete org, transfer ownership)

### User
- Profile — name, avatar, timezone
- Preferences — language (English / Hebrew), theme
- Security — change password
- Automations — rule-based automations (beta)
- Integrations — Discord webhook notifications

---

## Authentication

- Register with email verification
- Login with JWT-based sessions
- Forgot password / reset password via email link
- Accept organization invite via email
- Stale token detection — tokens invalidated server-side when a member is removed or role changes

---

## Notifications

- In-app inbox for mentions, assignments, and status changes
- Email notifications for verification, password reset, and invites
- Optional Discord webhook for team alerts

---

## File Attachments

Upload files directly on any issue. Stored in MinIO (S3-compatible), works with local storage out of the box — no AWS account required to self-host.

---

## Internationalization — Full Hebrew & English

The entire UI is available in **English** and **Hebrew**, including full RTL layout support. Switching language flips the entire interface direction — every component, modal, sidebar, and form. Set per user in Preferences.

---

## Deployment

Ships as pre-built multi-platform Docker images for `linux/amd64` and `linux/arm64`.

Runs on:
- Any Linux server (VPS, bare metal)
- Raspberry Pi 4 / 5
- Apple Silicon Mac (via Docker Desktop)
- Windows (via Docker Desktop + WSL2)

```bash
curl -O https://raw.githubusercontent.com/andreibel/bentolab/main/docker-compose.beta.yml
curl -O https://raw.githubusercontent.com/andreibel/bentolab/main/.env.example
cp .env.example .env
# fill in .env
docker compose -f docker-compose.beta.yml up -d
```

Open `http://localhost:3000`.

---

## Known Limitations (Beta)

- Automations and Integrations pages are present but partially implemented
- Calendar view is available but read-only in this release
- No SSO / OAuth login yet
- Mobile layout is functional but not fully optimized

---

## Infrastructure

| Component | Version |
|---|---|
| Spring Boot | 4.0 |
| Java | 25 |
| PostgreSQL | 17 |
| MongoDB | 8 |
| Redis | 7 |
| Kafka | 3 (KRaft — no ZooKeeper) |
| React | 19 |

---

*Bento is released under the AGPL-3.0 license.*  
*Built by [Andrei Beloziorov](https://github.com/andreibel)*
