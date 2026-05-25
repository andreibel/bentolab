---
title: Backlog
description: How to use the Bento backlog to manage unscheduled issues and drag them into sprints.
outline: [2, 3]
---

# Backlog

The backlog is a prioritized list of all issues not yet assigned to a sprint. Use it to groom unscheduled work, set priority order, and pull issues into upcoming sprints.

## Who can do this

All organization members can view the backlog. MEMBER and above can edit issues from it. OWNER and ADMIN can move issues into sprints.

## Steps

1. Click **Backlog** in the left sidebar (or navigate to `/board/:id/backlog`).
2. The backlog shows all unscheduled issues for the current board, grouped by sprint sections at the top (planned sprints) and the backlog at the bottom.
3. Drag issues up or down to change their priority order within the backlog.
4. To move an issue into a sprint: drag the issue from the backlog section into a sprint section, or right-click the issue and use the context menu to assign it to a sprint.

<!-- SCREENSHOT: images/backlog-page.png — backlog with sprint sections collapsed -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/backlog-drag-to-sprint.png — mid-drag of issue from backlog into sprint -->

## Troubleshooting

- **Issue not appearing in backlog** — Issues already assigned to a sprint or in a `Done` equivalent column may be filtered out. Check the filter controls at the top of the backlog.
- **Can't drag into a sprint** — You need OWNER or ADMIN role to move issues into sprints. MEMBER can reorder within the backlog.
