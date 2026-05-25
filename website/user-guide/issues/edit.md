---
title: Edit an Issue
description: How to edit an issue's title, description, and metadata in Bento.
outline: [2, 3]
---

# Edit an Issue

You can edit any field on an issue directly from the issue detail view. Most fields save on blur (when you click away). The title can be edited inline from the board card as well.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Edit issue | ✅ | ✅ | ✅ | ❌ |

## Steps

**From the issue detail view:**

1. Click an issue card on the board, or open an issue from the backlog, timeline, or My Issues.
2. The issue detail panel opens on the right (or a full-page modal, depending on your screen size).
3. Click any field to edit it:
   - **Title** — click the title text to make it editable, then press Enter or click away to save.
   - **Description** — click the description area to open the Markdown editor.
   - **Metadata fields** (assignee, labels, sprint, etc.) — click each field to open a picker or dropdown.
4. Changes are saved as you make them. No "Save" button is needed for metadata fields.

**Inline title edit from the board:**

1. Hover over a card on the board.
2. Click the edit control that appears on hover.
3. Edit the title inline and press Enter to confirm.

<!-- SCREENSHOT: images/issue-detail.png — issue detail view for ACME-42 -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/issue-edit-inline.png — inline edit of title -->

## Troubleshooting

- **Edit not saving** — Confirm you have MEMBER or higher role. VIEWER role is read-only.
- **Description changes lost** — The editor saves on blur. If you navigate away while the editor is focused without clicking out first, changes may be lost. Confirm the save by clicking outside the editor before navigating.
- **Conflict with another user's edit** — If two members edit the same field simultaneously, the last write wins. Activity logs show who changed what and when.
