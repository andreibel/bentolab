---
title: Labels
description: How to create and manage labels for categorizing issues in Bento.
outline: [2, 3]
---

# Labels

Labels are colored tags you attach to issues to categorize them by type, area, or any classification your team finds useful. Labels are managed at the organization level and shared across all boards.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Create / edit / delete labels | ✅ | ✅ | ✅ | ❌ |
| Apply labels to issues | ✅ | ✅ | ✅ | ❌ |

## Steps

**To create a label:**

1. Navigate to **Settings → Labels**.
2. Click the primary action button to open the create label form.
3. Enter a name and choose a color.
4. Click "Save". The label is immediately available on all boards.

**To apply a label to an issue:**

1. Open the issue detail view.
2. Find the labels field in the issue metadata panel.
3. Click the labels field to open the label picker.
4. Select one or more labels. Changes save immediately.

<!-- SCREENSHOT: images/labels-settings.png — labels management page, 4 labels -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/label-picker.png — label picker popover on an issue -->

## Troubleshooting

- **Label not appearing in picker** — Labels are loaded from the org. Refresh the page if a newly created label is missing.
- **Can't delete a label in use** — Deleting a label removes it from all issues that use it. The system will prompt you to confirm. <!-- TODO: confirm with maintainer — whether in-use labels can be deleted -->
