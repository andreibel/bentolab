---
title: Create a Board
description: How to create a new board in your Bento organization.
outline: [2, 3]
---

# Create a Board

A board is a workspace for tracking a stream of work. Create one board per project or team. Boards have their own columns, labels, sprints, and member list.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Create board | ✅ | ✅ | ❌ | ❌ |

## Steps

1. In the left sidebar, click the button to add a new board (next to the "Boards" section heading).
2. The "New board" dialog opens.
3. Enter a board name.
4. Choose a board type: **Kanban** (continuous flow) or **Scrum** (sprint-based). You can change this later in board settings.
5. Click the primary action button to create the board.
6. The board opens with four default columns: `Backlog`, `In Progress`, `In Review`, `Done`.

<!-- SCREENSHOT: images/create-board-modal.png — "New board" modal, name filled -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/empty-board.png — brand-new board, 4 default columns, no cards -->

## Troubleshooting

- **Board button not visible** — You need OWNER or ADMIN role to create boards. Contact your organization admin.
- **Board name already taken** — Board names must be unique within the organization. Choose a different name.
- **Columns missing after creation** — This is unexpected. Refresh the page; if the issue persists, check the board-service logs.
