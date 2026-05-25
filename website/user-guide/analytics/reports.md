---
title: Reports
description: How to view and interpret analytics reports in Bento — burndown, velocity, and cycle time.
outline: [2, 3]
---

# Reports

The reports page provides analytical views of your team's work history. Reports help you understand sprint performance, team velocity, and process efficiency over time.

## Who can do this

All organization members.

## Steps

1. Navigate to **Summary** or **Analytics → Reports** (at `/analytics/reports` or `/board/:id/summary`).
2. Select the board and sprint (or date range) using the filter controls.
3. Choose a report type from the available tabs.
4. Data is computed from closed sprints and issue history — reports update as sprints are closed.

<!-- SCREENSHOT: images/reports-burndown.png — burndown chart for Sprint 14 -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/reports-velocity.png — velocity chart across 5 sprints -->
<!-- SCREENSHOT: images/reports-cycle-time.png — cycle-time scatter -->

## Available reports

| Report | What it shows | Requires |
|---|---|---|
| **Burndown** | Remaining story points per day in a sprint vs. ideal burn | Active or closed sprint with estimated issues |
| **Velocity** | Story points completed per sprint over time | 2+ closed sprints |
| **Cycle time** | Time from issue start to done, as a scatter plot | Issues with start and close dates |
| **Issue breakdown** | Open vs. closed by type and priority | — |
| **Epic progress** | Completion percentage per epic | Issues linked to epics |
| **Bug rate** | Bug issues as a share of total work | — |
| **WIP** | Work in progress count vs. WIP limits | Columns with WIP limits set |
| **Overdue** | Issues past their due date | Issues with due dates |
| **Stale issues** | Issues with no activity in 14+ days | — |
| **Unassigned** | Issues with no owner | — |
| **Team activity** | Per-member contribution over time | — |
| **Workload** | Open issue count per assignee | — |
| **Recent activity** | Live feed of changes | — |
| **Sprint health** | Completion rate and remaining work | Active sprint |

## Troubleshooting

- **Burndown not showing data** — Issues need story point estimates. The burndown only tracks estimated issues.
- **Velocity chart showing only one sprint** — Velocity requires at least two closed sprints to draw a trend line.
- **Reports loading slowly** — Reports are computed on demand from the full issue history. Large organizations with many closed sprints may see slower load times.
