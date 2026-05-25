---
title: Dependencies
description: How to link issues with dependencies in Bento — blocks, relates to, and duplicates.
outline: [2, 3]
---

# Dependencies

Dependencies express relationships between issues. They appear on the Gantt timeline as arrows and on each issue's detail page as a dependency list.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Add / remove dependencies | ✅ | ✅ | ✅ | ❌ |
| View dependency graph | ✅ | ✅ | ✅ | ✅ |

## Steps

1. Open the issue detail view.
2. Navigate to the **Dependencies** tab or section.
3. Click the button to add a dependency.
4. The "Add dependency" dialog opens. Select the dependency type and search for the related issue.
5. Click "Add" to link the issues.
6. To remove a dependency, find it in the list and select remove from its actions menu.

<!-- SCREENSHOT: images/dependency-add-dialog.png — "Add dependency" dialog, type = "blocks" -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/dependency-graph.png — dependency graph widget on issue detail -->

## Types of links (blocks, relates, duplicates)

| Type | Meaning |
|---|---|
| **Blocks** | This issue must be completed before the linked issue can start. The blocked issue shows a warning if it is started while the blocker is not done. |
| **Relates to** | Informational link. The issues are related but neither blocks the other. |
| **Duplicates** | This issue is a duplicate of the linked issue. The duplicate is typically closed and the original tracked to completion. |

The link type is directional: "ACME-10 blocks ACME-20" is different from "ACME-20 blocks ACME-10".

## Troubleshooting

- **Can't find the target issue** — Search by issue ID (e.g. `ACME-42`) or title fragment. The search covers all issues in the organization, not just the current board.
- **Dependency arrow missing on timeline** — Dependency arrows only appear for issues that have both a start date and a due date on the timeline view. Set dates on both issues.
