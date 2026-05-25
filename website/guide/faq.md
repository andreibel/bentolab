---
title: FAQ
description: Answers to common questions about Bento — general use, self-hosting, data, and limits.
outline: [2, 3]
---

# FAQ

## General

### What is Bento?

Bento is an open-source project management system with Scrum and Kanban support. You can self-host it on any Linux machine or Raspberry Pi using a single Docker Compose file, or use the hosted cloud version.

### Is Bento free?

Yes. Bento is released under AGPL-3.0. You can self-host it for free, including for commercial use inside your organization. The source code is always available on GitHub.

### Does Bento support Kanban and Scrum?

Yes. Every board can be used as a Kanban board (continuous flow, no sprints) or a Scrum board (sprint-based). You configure this per board.

### Can I use Bento for a solo project?

Yes. You can create an organization with a single member. The minimal deployment profile uses under 2.4 GB of RAM, which is workable on a Raspberry Pi 5 for a small team or individual user.

## Self-Hosting

### What do I need to self-host Bento?

Docker 24+, at least 4 GB of RAM (2.4 GB for the minimal profile), and the ports listed in the [Requirements](../self-host/requirements.md) page free. See [Quickstart](./quickstart.md) for the three-command setup.

### Can I run Bento behind a reverse proxy?

Yes. Bento's API gateway listens on port 8080 and the frontend on port 3000. You can place Caddy or Nginx in front of both. See [Reverse Proxy & TLS](../self-host/reverse-proxy.md) for full config examples.

### Does Bento support HTTPS out of the box?

Not by default — TLS termination is the responsibility of your reverse proxy. Caddy handles this automatically with automatic certificate provisioning. See [Reverse Proxy & TLS](../self-host/reverse-proxy.md).

### How do I update to a new version?

```bash
docker compose -f docker-compose.beta.yml pull
docker compose -f docker-compose.beta.yml up -d
```

Data volumes are preserved across updates. See [Updates](../self-host/updates.md) for details.

### Can I use my own SMTP provider instead of MailHog?

Yes. MailHog is included for development only. Set `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, and `MAIL_PASSWORD` in `.env` to point to any SMTP provider. See [Email (SMTP)](../self-host/email.md).

## Data & Privacy

### Where is data stored?

Relational data (users, organizations, boards) is in PostgreSQL. Document data (issues, comments, activities) is in MongoDB. Files are stored in MinIO (S3-compatible). You own all of it — nothing is sent to any external service unless you configure integrations explicitly.

### Can I export my data?

Data export is available from **Settings → Org Advanced**. The export includes all issues, comments, and metadata in JSON format. <!-- TODO: confirm with maintainer -->

### Does Bento send any telemetry?

No. The self-hosted version does not collect or transmit any usage data.

## Limits

### How many organizations can one user belong to?

There is no hard limit. A user can be a member of multiple organizations and switch between them using the organization switcher in the top-left of the app.

### Is there a file size limit for attachments?

<!-- TODO: confirm with maintainer -->

### How many issues can a board handle?

Bento has been tested with boards containing thousands of issues. Performance at very large scale depends on your hardware and the deployment profile. See [Scaling](../self-host/scaling.md) for guidance.
