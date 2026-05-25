---
title: Introduction
description: Learn what Bento is, who it is for, and how it differs from other project management tools.
outline: [2, 3]
---

# Introduction

🧱 Bento is an open-source project management system you run on your own infrastructure — or on the Bento cloud. It supports Scrum and Kanban workflows, a Gantt timeline, real-time collaboration, and full Hebrew/English localization. The entire stack is built on Spring Boot 4, Java 25, React 19, and Apache Kafka.

<!-- SCREENSHOT: images/hero-splash.png — composed hero: board view with overlay of sprint report -->

## What Bento is

Bento gives teams a single place to track work from idea to done. The core building blocks are **organizations**, **boards**, **issues**, and **sprints**. You create an organization, invite members, create boards with custom columns, and move issues through them. Sprints let you time-box work; the Gantt timeline lets you see it all at once.

Everything runs as eight independent microservices behind a single API gateway. Each service owns its data store. Services communicate through Kafka events, which means a slow notification does not block a board update.

<!-- SCREENSHOT: images/board-overview.png — Platform board with 4 columns populated, no modal open -->

Key capabilities:

- **Boards** — drag-and-drop Kanban with configurable columns and WIP limits
- **Sprints** — plan, start, and close sprints with carry-over and velocity tracking
- **Backlog** — prioritize and pull issues into sprints from one view
- **Timeline** — Gantt chart with dependency arrows, epics, and milestones
- **Realtime** — every board update appears instantly via WebSocket/STOMP
- **Attachments** — files stored in MinIO (S3-compatible), no AWS account required
- **Analytics** — burndown, velocity, cycle time, and time-tracking reports
- **Notifications** — in-app inbox, email, and optional Discord webhooks
- **Internationalization** — full English and Hebrew (RTL) support, per-user locale

## Who it's for

Bento is designed for software teams of 2–50 people who:

- Want to self-host their project management tool and own their data
- Need Scrum workflows (sprints, backlog, burndown) alongside Kanban boards
- Work across multiple projects and need cross-project visibility (global timeline, workload)
- Operate in environments with strict data residency requirements

It also works as a single-user issue tracker. The minimal deployment profile runs on a Raspberry Pi 5 and uses under 2.4 GB of RAM.

## What it's not (yet)

Bento is in **beta**. The following capabilities are present but partially implemented or not yet available:

- **Automations and Integrations** — the settings pages exist; full rule execution is in progress
- **Calendar view** — available but read-only in this release
- **SSO / OAuth** — not yet available; email + password only
- **Mobile layout** — functional but not fully optimized for small screens
- **Public API documentation** — endpoints exist; this docs site covers known stable ones

If you need a feature that is missing, open an issue on GitHub. Bento is actively developed.

## License

Bento is released under the **AGPL-3.0** license. In practice this means:

- You can self-host it for free, including for commercial use inside your organization.
- If you modify Bento and offer it as a network service to others, you must release your changes under the same license.
- The source code is always available.

## Where to go next

- [Quickstart](./quickstart.md) — get a running instance in 5 minutes
- [Core Concepts](./concepts.md) — understand the domain model before diving in
- [Self-Host Overview](../self-host/overview.md) — choose a deployment profile
- [Architecture Overview](../architecture/overview.md) — understand the system design
