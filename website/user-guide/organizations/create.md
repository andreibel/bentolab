---
title: Create an Organization
description: How to create a new organization in Bento.
outline: [2, 3]
---

# Create an Organization

An organization is the top-level container for all your boards, issues, and members. You must create or join one before you can do any work in Bento. Creating an organization makes you its OWNER.

## Who can do this

Any authenticated user (logged in, email verified).

## Steps

1. After logging in for the first time, you are prompted to create an organization automatically.
2. To create an additional organization later, navigate to `/org/new`.
3. Enter the organization name (visible to all members) and a slug (used in the URL — lowercase, letters, numbers, and hyphens only).
4. Click the primary action button to create the organization.
5. You are redirected to the organization's home page, where you can create your first board.

<!-- SCREENSHOT: images/create-org-form.png — /org/new with all fields filled for Acme -->

## Screenshot walkthrough

<!-- SCREENSHOT: images/org-just-created.png — post-create landing, "Create your first board" CTA visible -->

## Troubleshooting

- **"Slug already taken"** — Choose a different slug. Slugs are unique across the entire Bento instance.
- **Slug validation error** — Slugs must be lowercase and may contain only letters, numbers, and hyphens. No spaces or special characters.
- **Redirected back to login** — Your session may have expired. Log in again and retry.
