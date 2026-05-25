---
title: Start a Sprint
description: How to start a planned sprint in Bento.
outline: [2, 3]
---

# Start a Sprint

Starting a sprint moves it from `Planned` to `Active`. Only one sprint can be active per board at a time. Once active, the board shows a sprint progress banner and the burndown chart starts tracking.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Start a sprint | ✅ | ✅ | ❌ | ❌ |

## Steps

1. Navigate to **Sprints** and find the sprint you want to start.
2. Click the button to start the sprint. The start sprint dialog opens.
3. Confirm the sprint name, start date, and end date. Adjust the duration if needed.
4. Click "Start sprint". The sprint becomes `Active`.
5. The board now shows all sprint issues in their columns, and the sprint banner displays days remaining.

<!-- SCREENSHOT: images/start-sprint-modal.png — start-sprint dialog, duration = 2 weeks -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/sprint-active.png — board view, sprint banner showing "4 days left" -->

## Troubleshooting

- **"Another sprint is already active"** — Only one sprint can be active per board. Close the current sprint before starting a new one. See [Close a Sprint](./close.md).
- **Sprint not showing on board** — Confirm the sprint is in `Active` state. The board only shows issues from the active sprint by default. Use the sprint filter to switch views.
