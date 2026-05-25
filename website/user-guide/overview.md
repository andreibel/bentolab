---
title: User Guide Overview
description: An overview of the Bento user interface and how to navigate the application.
outline: [2, 3]
---

# User Guide Overview

Bento is organized around organizations, boards, and issues. Once you are logged in and have joined an organization, you can create boards, track issues, plan sprints, and collaborate with your team in real time.

## Who can do this

All authenticated members of an organization can access the main application views.

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| View boards and issues | ✅ | ✅ | ✅ | ✅ |
| Create and edit issues | ✅ | ✅ | ✅ | ❌ |
| Manage boards | ✅ | ✅ | ❌ | ❌ |
| Manage members | ✅ | ✅ | ❌ | ❌ |

<!-- SCREENSHOT: images/board-overview.png — Platform board with 4 columns populated, no modal open -->

## Navigation map

The main navigation is in the left sidebar. The top section contains global views; the bottom section contains organization and settings links.

**Global views:**
- **Board** — the Kanban or Scrum board for the currently selected board
- **Backlog** — all issues not in a sprint, organized by priority
- **Sprints** — sprint management for the current board
- **Timeline** — Gantt chart for the current board
- **Summary** — analytics dashboard for the current board

**Cross-board views (accessible from the left rail):**
- **My Issues** — all issues assigned to you, across all boards
- **Calendar** — issues with due dates on a monthly calendar
- **Inbox** — in-app notifications (mentions, assignments, status changes)
- **Timeline (global)** — Gantt view across all boards in the organization

**Organization:**
- Switch between organizations using the organization switcher in the top-left corner
- Access settings from the gear icon in the bottom-left of the sidebar

**Boards:**
- Create and switch between boards using the board list in the sidebar
- Each board has its own URL — bookmark a board to return to it directly

::: tip Keyboard shortcut
Press `Cmd/Ctrl + K` (or the keyboard shortcut shown in your UI) to open the command palette, which lets you jump to any board, issue, or settings page without touching the mouse.
:::
