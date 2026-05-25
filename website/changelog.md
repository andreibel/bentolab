---
title: Changelog
description: Release notes for Bento versions.
outline: [2, 3]
---

# Changelog

## v0.1.1-beta-4

> Current release. Tag: `v0.1.1-beta-4`. All Docker images updated.

See [v0.1.1-beta-3-hotfix / v0.1.1-beta-3](#v0-1-1-beta-3-hotfix) below for the full feature list. Beta-4 contains image tag updates and stability fixes from the beta-3 release cycle.

## v0.1.1-beta-3-hotfix

> First public beta release of Bento.

### Boards — Kanban & Scrum

Full drag-and-drop Kanban and Scrum boards. Create any number of boards per organization, define custom columns, and move issues between them. Pull issues from the backlog directly onto the board. Board membership lets you control who sees what.

### Sprints

Plan, start, and complete sprints. Move issues in and out of a sprint, track sprint health in real time, and close a sprint with a summary of completed vs. carried-over work.

### Timeline — Gantt Chart

A full Gantt-style timeline view showing every issue with a start and due date. Visualize overlaps, dependencies, and epic progress across the entire project at a glance.

### Real-Time Collaboration

Every board updates live — no refresh needed. When a teammate moves a card, creates an issue, or changes a status, you see it immediately. Presence indicators show who else is on the board right now. Built on WebSocket/STOMP.

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

Jump to any board, issue, or setting without touching the mouse.

### Dashboard & Analytics

A summary dashboard with 15 live widgets: Sprint Health, Velocity, Issue Breakdown, Priority Breakdown, Open/Closed trend, Epic Progress, Bug Rate, Cycle Time, WIP, Overdue, Stale Issues, Unassigned, Team Activity, Workload, and Recent Activity.

### Planning Views

- **Roadmap** — epic-level view across time
- **Sprints** — manage all sprints across boards from one place
- **Workload** — see how work is distributed across the team

### Settings

- Organization: name, logo upload with crop tool
- Members: invite by email, manage roles (Owner, Admin, Member), remove members
- Labels: create and manage labels with custom colors
- Advanced: delete org, transfer ownership
- User: profile, avatar, timezone, preferences (language, theme), security
- Automations: rule-based automations (beta — partially implemented)
- Integrations: Discord webhook notifications

### Authentication

- Register with email verification (24-hour link, single-use)
- Login with JWT-based sessions
- Forgot password / reset password via email link (1-hour token)
- Accept organization invite via email
- Stale token detection — tokens invalidated server-side when a member is removed or role changes

### Notifications

- In-app inbox for mentions, assignments, and status changes
- Email notifications for verification, password reset, and invites
- Optional Discord webhook for team alerts

### File Attachments

Upload files directly on any issue. Stored in MinIO (S3-compatible). No AWS account required to self-host.

### Internationalization

Full English and Hebrew (RTL) UI. Set per user in Preferences.

### Deployment

Pre-built Docker images for `linux/amd64` and `linux/arm64`. Single `docker compose up -d` to start.

### Known Limitations (Beta)

- Automations and Integrations pages are present but partially implemented
- Calendar view is available but read-only
- No SSO / OAuth login
- Mobile layout is functional but not fully optimized

### Infrastructure

| Component | Version |
|---|---|
| Spring Boot | 4.0 |
| Java | 25 |
| PostgreSQL | 17 |
| MongoDB | 8 |
| Redis | 7 |
| Kafka | 3 (KRaft) |
| React | 19 |

## Older

Earlier pre-beta development builds were not publicly released.
