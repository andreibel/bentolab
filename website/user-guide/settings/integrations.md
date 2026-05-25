---
title: Integrations
description: How to configure external integrations in Bento, including Discord webhooks.
outline: [2, 3]
---

# Integrations

The integrations page lets you connect Bento to external services for notifications and alerts. Currently, Discord webhook integration is available.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Configure integrations | ✅ | ✅ | ❌ | ❌ |

## Steps

1. Navigate to **Settings → Integrations** (at `/settings/integrations`).
2. The integrations index shows available integrations as cards.
3. Click the Discord card to open the Discord webhook configuration.
4. Paste your Discord webhook URL into the configuration form.
5. Select which event types you want to send to Discord.
6. Click "Save". Bento sends a test message to confirm the webhook is working.

<!-- SCREENSHOT: images/settings-integrations.png — integrations index with Discord + Slack cards -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/discord-webhook-config.png — Discord integration config form filled -->

## Troubleshooting

- **Discord test message not arriving** — Confirm the webhook URL is correct and the Discord channel still exists. Check that `DISCORD_ENABLED=true` is set in your `.env` file. See [Environment Variables](../../self-host/environment.md).
- **Integration page visible but saving fails** — Confirm you have OWNER or ADMIN role.
- **Slack integration** — <!-- TODO: confirm with maintainer — Slack integration status in beta -->
