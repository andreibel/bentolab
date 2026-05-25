---
title: Automations
description: How to configure automation rules in Bento to trigger actions when conditions are met.
outline: [2, 3]
---

# Automations

Automations let you define rules that trigger actions automatically when conditions are met on your board. They reduce repetitive manual work.

::: warning Beta feature
Automations are partially implemented in the current beta. The settings page is available and rules can be created, but not all trigger/action combinations execute reliably. Check the release notes for the current status.
:::

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Create / edit automations | ✅ | ✅ | ❌ | ❌ |

## Steps

1. Navigate to **Settings → Automations** (at `/settings/automations`).
2. The automations list shows all existing rules with their trigger and action.
3. Click the button to create a new automation rule.
4. The rule editor opens. Select a trigger event and an action to perform.
5. Click "Save". The rule is immediately active.
6. To disable a rule without deleting it, toggle the enabled switch on the rule row.

<!-- SCREENSHOT: images/settings-automations.png — automations list with 3 rules -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/automation-rule-editor.png — rule editor: trigger + action chosen -->

## Trigger → Action catalog

| Trigger | Available actions |
|---|---|
| Issue moved to column | Assign to member, change priority, set label |
| Issue assigned | Post comment, send notification |
| Sprint starts | Move all backlog issues to first column |
| Sprint closes | Generate summary comment |

<!-- TODO: confirm with maintainer — complete trigger/action catalog for beta -->

## Troubleshooting

- **Rule not firing** — Check that the rule is enabled (toggle is on). Automation execution is logged; check the rule's activity log if available.
- **Can't save a rule** — Confirm you have OWNER or ADMIN role.
