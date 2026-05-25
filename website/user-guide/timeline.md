---
title: Timeline (Gantt)
description: How to use the Bento Gantt timeline to visualize issues, epics, and dependencies over time.
outline: [2, 3]
---

# Timeline (Gantt)

The timeline view shows issues with start and due dates on a Gantt chart. Use it to spot scheduling conflicts, visualize epic progress, and manage dependencies visually.

## Who can do this

All organization members can view the timeline. MEMBER and above can edit dates from it.

## Steps

1. Click **Timeline** in the left sidebar (or navigate to `/board/:id/timeline`).
2. Issues with both a start date and a due date appear as horizontal bars.
3. Drag the left or right edge of a bar to adjust start or end date.
4. Drag the bar itself to move the entire issue date range.
5. Click a bar to open the issue detail view.
6. To create a dependency arrow: hover over the right edge of an issue bar until a connector handle appears, then drag to another issue bar.

<!-- SCREENSHOT: images/timeline-gantt.png — Gantt with 8 bars and 2 dependency arrows, month zoom -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/timeline-dependency-drag.png — mid-drag creating a dependency arrow -->

## Zoom levels

Use the zoom controls in the timeline toolbar to change the time scale:

| Zoom | Shows |
|---|---|
| Day | Hour-by-hour view of a single day |
| Week | Daily columns for a week |
| Month | Weekly columns for a month |
| Quarter | Monthly columns for a quarter |

The active zoom level is preserved when you navigate away and return.

## Troubleshooting

- **Issue not appearing on timeline** — Issues must have both a start date and a due date to appear. Set both from the issue detail view.
- **Dependency arrow not creating** — Hover precisely over the right edge of the source bar until the handle appears. Then drag to the left edge of the target bar.
