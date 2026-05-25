---
title: Time Tracking
description: How to log time spent on issues in Bento.
outline: [2, 3]
---

# Time Tracking

Log time entries against issues to track how long work takes. Time logs are aggregated in the analytics time-tracking reports.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Log time | ✅ | ✅ | ✅ | ❌ |
| View time logs | ✅ | ✅ | ✅ | ✅ |
| Delete own time logs | ✅ | ✅ | ✅ | ❌ |

## Steps

1. Open the issue detail view.
2. Find the **Time Tracking** section or tab.
3. Click the button to log time.
4. The log-time dialog opens. Enter:
   - **Time spent** — format: `2h 30m`, `45m`, `1d` (days are 8 hours)
   - **Description** (optional) — what you worked on
   - **Date** — defaults to today
5. Click "Save" to record the entry.
6. The entry appears in the time logs list on the issue. The total logged time is shown in the issue metadata.

<!-- SCREENSHOT: images/time-log-modal.png — log-time dialog, 2h 30m + description -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/time-log-list.png — time logs list on issue, 3 entries -->

## Troubleshooting

- **Time format not accepted** — Use `Xh Ym` format (e.g. `2h 30m`, `45m`, `1h`). Days use `Xd` and count as 8 hours.
- **Time log not appearing in analytics** — Analytics aggregate on a schedule. Allow a few minutes for new logs to appear in the reports.
- **Can't delete another member's time log** — You can only delete your own time logs unless you are OWNER or ADMIN.
