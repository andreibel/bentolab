---
title: Columns & Workflow
description: How to add, rename, reorder, and configure columns on a Bento board.
outline: [2, 3]
---

# Columns & Workflow

Columns represent stages in your team's workflow. You can add, rename, reorder, and delete columns, and set WIP (work-in-progress) limits on each one.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Add / edit / delete columns | ✅ | ✅ | ❌ | ❌ |
| Reorder columns | ✅ | ✅ | ❌ | ❌ |

## Steps

1. Navigate to the board, then open **Board settings** (accessible via the settings icon near the board title).
2. Select the **Columns** tab.
3. To add a column: click the button to add a column at the end of the list and enter a name.
4. To rename a column: click the column name inline and edit it.
5. To reorder: drag a column row by its drag handle to the desired position.
6. To delete a column: open the actions menu on the column row and select delete. Issues in a deleted column are moved to the first column.
7. Click "Save" to apply changes.

Alternatively, add a column directly on the board by clicking the add-column control at the end of the board.

<!-- SCREENSHOT: images/board-columns-edit.png — column settings panel with WIP limit set -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/board-columns-reorder.png — mid-drag of a column -->

## WIP limits

A WIP limit caps the number of issues that can be in a column at one time. When the limit is reached, the column header displays a warning and the board discourages adding more issues.

To set a WIP limit:

1. In the columns settings panel, find the WIP limit field for the column.
2. Enter a number (or leave blank for no limit).
3. Click "Save".

WIP limits are advisory — the system warns but does not block adding issues beyond the limit.

## Troubleshooting

- **Can't edit columns** — You need OWNER or ADMIN role. Check your role in **Settings → Members**.
- **Deleted column's issues gone** — Issues are moved to the first column on delete, not deleted. Filter by "All columns" if they are not visible on the board.
