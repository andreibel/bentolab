---
title: Close a Sprint
description: How to close an active sprint, handle carry-over issues, and view the sprint report in Bento.
outline: [2, 3]
---

# Close a Sprint

Closing a sprint marks it as `Closed`, generates a sprint report, and lets you decide what happens to unfinished issues. You can carry them over to a new or existing sprint, or move them back to the backlog.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Close a sprint | ✅ | ✅ | ❌ | ❌ |

## Steps

1. Navigate to **Sprints** and find the active sprint.
2. Click the button to close the sprint.
3. The close-sprint dialog shows a summary: completed issues, incomplete issues, and carry-over options.
4. For each incomplete issue, choose:
   - **Move to backlog** — the issue returns to the unscheduled backlog
   - **Move to next sprint** — select a planned sprint to receive the issue
5. Click "Close sprint". The sprint is marked `Closed` and the sprint report is generated.
6. The sprint report is available from the **Sprints** page under the closed sprint's entry.

<!-- SCREENSHOT: images/close-sprint-modal.png — close-sprint dialog showing 2 unfinished issues with carry-over options -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/sprint-report.png — sprint report: burndown + summary numbers -->

## Carry-over

Any issue not in the `Done` column at sprint close is considered incomplete. Bento counts these and prompts you to decide their fate individually. The carry-over decision is recorded in the issue's activity log.

## Velocity

After closing a sprint, Bento calculates **velocity** — the total story points completed (issues in the `Done` column) during the sprint. Velocity is used in the capacity indicator for future sprint planning and in the velocity chart in [Analytics → Reports](../analytics/reports.md).

## Troubleshooting

- **Close sprint button disabled** — Confirm the sprint is in `Active` state and you have OWNER or ADMIN role.
- **Sprint report not appearing** — The report is generated asynchronously. Wait a few seconds and refresh the sprints page.
