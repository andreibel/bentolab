---
title: Troubleshooting
description: Common Bento self-hosting errors and how to fix them.
outline: [2, 3]
---

# Troubleshooting

## Container won't start

Check the container logs:

```bash
docker compose -f docker-compose.beta.yml logs <service-name>
```

**Exit code 1 on startup** — Usually a missing or invalid environment variable. Confirm all required `.env` values are set and non-empty. See [Environment Variables](./environment.md).

**"Connection refused" to a database** — The application service started before its database container was healthy. This should not happen with the compose file's `depends_on` healthchecks, but if it does:

```bash
docker compose -f docker-compose.beta.yml restart <service-name>
```

**"Address already in use"** — A port conflict. Check which process is using the port:

```bash
lsof -i :3000
lsof -i :8080
```

Change the conflicting port using the environment variables (`FRONTEND_PORT`, etc.) or stop the conflicting process.

## Login fails / 401

**"TOKEN_STALE" error** — Your session token was invalidated server-side (you were removed from an organization or your role changed). Log out and log back in.

**401 on all API calls after restart** — The `JWT_SECRET` in `.env` changed between restarts. All existing tokens are invalid. Users must log in again. Do not change `JWT_SECRET` unless you intend to invalidate all sessions.

**"Invalid credentials"** — The password is wrong, or `AUTH_PEPPER` was changed (which changes how passwords hash). If you changed `AUTH_PEPPER`, existing passwords no longer verify and users must reset them via "Forgot password".

## Emails not arriving

**Email stays in MailHog** — You are still using the default dev configuration. MailHog captures email locally; it does not deliver to real inboxes. Configure your SMTP provider in the notification service. See [Email (SMTP)](./email.md).

**Notification service crash loop** — Check logs:

```bash
docker compose -f docker-compose.beta.yml logs notification-service
```

A common cause is a missing `MAIL_FROM` or an unreachable SMTP host.

**`FRONTEND_URL` missing** — Email links (verify, reset) contain this value. If it is empty or wrong, links in emails will be broken. Set it to the public URL of your Bento instance.

## Realtime not connecting

**WebSocket connection fails** — The realtime service listens on port 8086 inside Docker. Ensure your reverse proxy forwards WebSocket connections correctly. See [Reverse Proxy & TLS](./reverse-proxy.md#websocket-pass-through).

**Board does not update live** — Confirm the realtime service is running:

```bash
docker compose -f docker-compose.beta.yml ps realtime-service
```

Check for Kafka connectivity issues in the realtime service logs.

## Attachment upload fails

**403 from attachment service** — Confirm the `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` in your `.env` match the MinIO container's configuration. If you changed credentials after the first run, update both the MinIO container and the attachment service environment and restart.

**"No such bucket"** — The `bento-attachments` bucket was not created. Log in to the MinIO console at `http://localhost:9001` and create it manually. See [File Storage (MinIO)](./storage-minio.md#creating-the-bucket).

**Upload times out** — If you are behind Nginx, increase `client_max_body_size`. Default is 1 MB which will reject most file attachments. Set it to `100m` or higher. See [Reverse Proxy & TLS](./reverse-proxy.md#common-pitfalls).

## Collecting logs

To capture logs from all services at once:

```bash
docker compose -f docker-compose.beta.yml logs --tail=100 > bento-logs-$(date +%F).txt
```

To follow logs in real time while reproducing a problem:

```bash
docker compose -f docker-compose.beta.yml logs -f api-gateway auth-service
```

When opening a GitHub issue, include the relevant log output and the output of `docker compose ps`.
