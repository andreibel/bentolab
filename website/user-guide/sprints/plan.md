---
title: Plan a Sprint
description: How to plan a sprint by selecting issues from the backlog in Bento.
outline: [2, 3]
---

# Plan a Sprint

Sprint planning involves creating a sprint, setting its goal and dates, and selecting which backlog issues to include. Bento shows you capacity based on story points to help you avoid over-committing.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Plan a sprint | ✅ | ✅ | ❌ | ❌ |

## Steps

1. Navigate to **Sprints** and click the button to create a new sprint.
2. Enter a sprint name, goal (optional), start date, and end date.
3. Click "Create". The sprint is created in the `Planned` state.
4. Open the sprint planning view. The backlog appears on the left; the sprint bucket appears on the right.
5. Drag issues from the backlog into the sprint bucket, or click the add-to-sprint control on each issue.
6. Watch the capacity indicator — it shows the total story points in the sprint vs. the team's average velocity from previous sprints.
7. When you are satisfied with the sprint scope, click "Save" or proceed to [Start the Sprint](./start.md).

<!-- SCREENSHOT: images/sprint-planning.png — planning view, backlog on left, sprint bucket on right -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/sprint-capacity.png — capacity indicator at 80% -->

## Troubleshooting

- **Issues not appearing in backlog** — Unstarted issues with no sprint assignment appear in the backlog. Issues currently in another planned sprint will not appear.
- **Capacity indicator always 0** — Story point estimates are needed on issues for capacity to calculate. See [Assign & Estimate](../issues/assign.md).
- **Can't create a sprint** — You need OWNER or ADMIN role.
