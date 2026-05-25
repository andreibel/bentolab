---
title: Labels Settings
description: How to manage organization-wide issue labels from the settings page in Bento.
outline: [2, 3]
---

# Labels Settings

Organization labels are managed here. Labels created in settings are available across all boards and can be applied to any issue.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Create / edit / delete labels | ✅ | ✅ | ✅ | ❌ |

## Steps

1. Navigate to **Settings → Labels** (at `/settings/labels`).
2. The labels list shows all existing labels with their names and colors.
3. To create a label: click the primary action button, enter a name and choose a color, then click "Save".
4. To edit: click a label's name or color to modify it inline.
5. To delete: open the actions menu on a label row and select delete. The label is removed from all issues that use it.

<!-- SCREENSHOT: images/settings-labels.png — labels management page, 4 labels -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/settings-labels.png — labels management page, 4 labels -->

## Troubleshooting

- **Label not appearing on issues** — Refresh the issue detail page after creating a label. The label picker loads the full label list on open.
- **Can't delete a label** — A confirmation is required before deletion to prevent accidental removal of widely-used labels.
