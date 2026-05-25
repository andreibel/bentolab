---
title: Org General Settings
description: How to update your organization's name, slug, and logo in Bento.
outline: [2, 3]
---

# Org General Settings

General organization settings control the public-facing name, URL slug, and logo of your organization.

## Who can do this

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Edit org general settings | ✅ | ❌ | ❌ | ❌ |

## Steps

1. Navigate to **Settings → Org General** (at `/settings/org-general`).
2. Update any of the following fields:
   - **Organization name** — the display name visible to all members
   - **Slug** — the URL identifier (lowercase, letters, numbers, hyphens only). Changing the slug changes the organization's URL.
   - **Logo** — upload an image to replace the default organization avatar
3. Click "Save" to apply changes.

<!-- SCREENSHOT: images/settings-org-general.png — org general settings (name, slug, logo) -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/settings-org-general.png — org general settings (name, slug, logo) -->

## Troubleshooting

- **Slug already taken** — Slugs are unique across the Bento instance. Choose a different one.
- **Logo not saving** — Check the image format (JPEG, PNG, WebP) and file size. <!-- TODO: confirm with maintainer — logo size limit -->
- **Can't access this page** — Only the OWNER role can access Org General settings. ADMINs are redirected.
