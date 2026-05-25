---
title: Preferences
description: How to set your language, theme, and other personal preferences in Bento.
outline: [2, 3]
---

# Preferences

The preferences page controls your personal display settings — the UI language, text direction, and color theme.

## Who can do this

Any authenticated member (your own preferences only).

## Steps

1. Navigate to **Settings → Preferences** (at `/settings/preferences`).
2. Select your preferred language from the language picker.
3. Select your preferred theme (Light, Dark, or System).
4. Click "Save". The page reloads with the new settings applied.

<!-- SCREENSHOT: images/settings-preferences.png — preferences with locale = English, theme = Light -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/language-picker.png — dropdown open showing English + Hebrew + (other) -->
<!-- SCREENSHOT: images/theme-toggle.png — theme radio group: Light / Dark / System, Light selected -->

## RTL languages

When you select Hebrew (`he`), Bento switches the entire UI to right-to-left layout. Every component, sidebar, modal, and form flips direction. Arabic and other RTL languages follow the same behavior when added.

The `dir` attribute on the `<html>` element switches between `ltr` and `rtl` based on the selected language. If your browser or OS also has a locale set, Bento's user preference takes precedence.

## Troubleshooting

- **Language not changing** — Confirm you clicked "Save" and waited for the page reload.
- **RTL layout partially broken** — If a specific UI element does not flip to RTL, report it as a bug on GitHub with a screenshot.
- **Theme not applying** — "System" mode follows your OS dark/light preference via `prefers-color-scheme`. Switching the OS theme should update the app immediately.
