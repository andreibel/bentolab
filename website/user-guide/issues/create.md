---
title: Create an Issue
description: How to create an issue in Bento using the full create form or quick-add.
outline: [2, 3]
---

# Create an Issue

Issues are the atomic unit of work in Bento. Each issue has a title, description, priority, assignee, labels, dates, and story points. You can create issues from the board, the backlog, or the issue list.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Create issue | ✅ | ✅ | ✅ | ❌ |

## Steps

**Full create (recommended for detailed issues):**

1. Click the "Create" button in the top navigation bar, or press the keyboard shortcut for create (shown in the command palette).
2. The full create modal opens. Fill in:
   - **Title** (required)
   - **Description** — Markdown supported, including task lists and code blocks
   - **Priority** — Urgent, High, Medium, Low, None
   - **Assignee** — any board member
   - **Labels** — one or more from the org label list
   - **Epic / Milestone / Sprint** — optional grouping
   - **Story points** — Fibonacci scale
   - **Start date / Due date**
3. Click "Create" to save. The issue appears on the board in the first column.

**Quick add (for fast capture):**

1. On the board, scroll to the bottom of any column.
2. Click the quick-add control at the column bottom.
3. Type a title and press Enter. The issue is created with default values and appears at the bottom of that column.

<!-- SCREENSHOT: images/create-issue-modal.png — full-create modal, all fields filled, Markdown preview on -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/issue-quick-add.png — quick-add inline form at column bottom -->

## Quick add vs full create

| | Quick add | Full create |
|---|---|---|
| Speed | Fast — title only | Slower — all fields |
| Fields | Title + column placement | All fields |
| Best for | Capturing ideas quickly | Planning with full detail |

## Troubleshooting

- **Create button not visible** — You need MEMBER or higher role. VIEWER cannot create issues.
- **Issue appears in wrong column** — Quick-add creates the issue in the column you clicked. Use the full create form and specify the column explicitly.
- **Markdown not rendering** — Click the preview toggle in the description editor to verify your Markdown. The preview shows rendered output.
