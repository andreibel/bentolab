---
title: Core Concepts
description: Definitions of every domain term used throughout the Bento documentation.
outline: [2, 3]
---

# Core Concepts

Every term used across the Bento docs is defined here. Read this page before diving into the user guide or API reference.

## Organization

An organization is the top-level multi-tenant boundary in Bento. All boards, members, labels, and issues belong to exactly one organization. A user can belong to multiple organizations and switch between them at any time. In the cloud deployment, each organization maps to a subdomain; in self-hosted deployments, a single organization is the norm.

## Board

A board is a workspace for tracking a stream of work. It contains columns, issues, labels, and optional sprint configuration. Boards can be Kanban (continuous flow) or Scrum (sprint-based). Each board has its own member list — organization members must be added to a board before they can see or interact with it.

## Column

A column represents a stage in your workflow — for example, `Backlog`, `In Progress`, `In Review`, `Done`. Columns belong to a board and are ordered. Issues move between columns as work progresses. Each column can have an optional WIP (work-in-progress) limit; the UI warns when the limit is exceeded.

## Issue

An issue is the atomic unit of work. It has a title, a Markdown description, a priority, a status, an assignee, labels, story points, start and due dates, and links to an epic, milestone, and sprint. Issues also have a comment thread, an activity log, file attachments, time logs, and dependency links to other issues. The issue identifier (e.g. `ACME-42`) is unique within the organization.

## Epic

An epic is a large body of work that spans multiple issues and possibly multiple sprints. Epics appear on the Gantt timeline and in planning views. Issues can be assigned to an epic to group related work. Epics have start and due dates and track aggregate progress from their child issues.

## Milestone

A milestone marks a significant point in time — a release, a demo, a deadline. Issues can be assigned to a milestone. Milestones appear on the timeline and in reporting. They have a due date and a title.

## Sprint

A sprint is a fixed-length timebox (typically 1–3 weeks) during which a team works on a defined set of issues. A sprint moves through three states: `planned`, `active`, and `closed`. Only one sprint per board can be active at a time. When you close a sprint, Bento generates a report and lets you carry unfinished issues forward.

## Label

A label is a colored tag attached to issues to indicate category, type, or any other classification. Labels are managed at the organization level and shared across all boards. Common labels include `bug`, `feature`, `chore`, and `security`.

## Dependency

A dependency is a directional link between two issues. Bento supports three dependency types:

- **Blocks** — issue A must finish before issue B can start
- **Relates to** — informational link between related issues
- **Duplicates** — marks one issue as a duplicate of another

Dependency arrows appear on the Gantt timeline and on each issue detail page.

## Role

A role determines what a member can do within an organization. There are four roles:

| Role | Description |
|---|---|
| **OWNER** | Full access. Can delete the org, transfer ownership, and do everything below. |
| **ADMIN** | Can manage boards, members, labels, and sprints. Cannot delete the org or touch the OWNER role. |
| **MEMBER** | Can create and edit issues, comment, and manage labels. Cannot manage boards or members. |
| **VIEWER** | Read-only access. Cannot create or edit issues. |

## Member

A member is a user who has accepted an invitation to join an organization. Members have a role and optionally a board-level permission override. A user who has been invited but not yet accepted is a **pending member**.

## Workspace vs Tenant

"Workspace" and "tenant" are sometimes used interchangeably in the codebase and docs. In Bento's architecture, **tenant** is the correct term — it refers to the data isolation boundary enforced by the org ID. Each organization is one tenant. There is no separate "workspace" entity; the organization is the workspace.
