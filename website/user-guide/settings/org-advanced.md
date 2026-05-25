---
title: Org Advanced Settings
description: Advanced organization settings in Bento — data export, retention, and the danger zone.
outline: [2, 3]
---

# Org Advanced Settings

Advanced settings include data export, retention configuration, and destructive operations (the danger zone). These actions are irreversible — proceed with care.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Access advanced settings | ✅ | ❌ | ❌ | ❌ |
| Export data | ✅ | ❌ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ |

## Steps

1. Navigate to **Settings → Org Advanced** (at `/settings/org-advanced`).
2. For data export: find the export section and click the button to request an export. Bento generates a JSON archive of all organization data and provides a download link. <!-- TODO: confirm with maintainer — export format and delivery method -->
3. For retention settings: <!-- TODO: confirm with maintainer — data retention configuration -->

<!-- SCREENSHOT: images/settings-org-advanced.png — advanced settings (data export, retention) -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/settings-org-advanced.png — advanced settings (data export, retention) -->

## Danger zone

The danger zone section contains operations that permanently alter or destroy your organization.

**Transfer ownership:**
1. In the danger zone, find the "Transfer ownership" section.
2. Select a new owner from the member list.
3. Confirm by entering the organization slug.
4. Click to confirm. Your role becomes ADMIN. The selected member becomes OWNER.

**Delete organization:**
1. In the danger zone, find the "Delete organization" section.
2. Click the delete button.
3. A confirmation dialog appears.
4. Enter the organization slug to confirm you understand this is irreversible.
5. Click to confirm. All boards, issues, members, and data are permanently deleted.

<!-- SCREENSHOT: images/danger-zone.png — delete-org confirmation dialog -->

::: danger Deletion is permanent
Deleting an organization removes all boards, issues, comments, members, and files. There is no undo and no automatic backup. Take a manual backup first — see [Backup & Restore](../../self-host/backup.md).
:::

## Troubleshooting

- **Can't access this page** — Only the OWNER can access Org Advanced. ADMINs cannot see this page.
- **Delete button disabled** — Confirm you entered the exact organization slug in the confirmation field.
