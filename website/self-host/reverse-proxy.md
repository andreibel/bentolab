---
title: Reverse Proxy & TLS
description: Configure Caddy or Nginx as a reverse proxy in front of Bento with TLS termination.
outline: [2, 3]
---

# Reverse Proxy & TLS

Bento's frontend listens on port 3000 and the API gateway on port 8080. A reverse proxy in front of both handles TLS termination, HTTPS redirects, and WebSocket pass-through for the realtime service.

## Caddy (recommended)

Caddy automatically obtains and renews TLS certificates via Let's Encrypt. This is the simplest production setup.

Add Caddy to your compose file or run it on the host. Example `Caddyfile`:

```
bento.example.com {
    # Frontend
    handle /* {
        reverse_proxy localhost:3000
    }

    # API and WebSocket
    handle /api/* {
        reverse_proxy localhost:8080
    }

    handle /ws/* {
        reverse_proxy localhost:8086 {
            header_up Connection {http.request.header.Connection}
            header_up Upgrade {http.request.header.Upgrade}
        }
    }
}
```

::: tip
Replace `bento.example.com` with your actual domain. Caddy handles the ACME challenge automatically — no certificate configuration needed.
:::

To run Caddy as a Docker service, add it to `docker-compose.beta.yml`:

```yaml
caddy:
  image: caddy:2-alpine
  restart: unless-stopped
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile
    - caddy_data:/data
    - caddy_config:/config
```

And add `caddy_data` and `caddy_config` to the `volumes` section.

## Nginx

If you prefer Nginx, use this server block as a starting point. You will need to obtain a TLS certificate separately (e.g. via `certbot`).

```nginx
server {
    listen 80;
    server_name bento.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bento.example.com;

    ssl_certificate     /etc/letsencrypt/live/bento.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bento.example.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # API Gateway
    location /api/ {
        proxy_pass         http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # WebSocket (realtime)
    location /ws/ {
        proxy_pass         http://localhost:8086;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_read_timeout 86400s;
    }
}
```

## Websocket pass-through

The realtime service uses WebSocket/STOMP at `/ws/`. Both proxy configs above handle this, but if you add your own proxy layer confirm:

1. `proxy_http_version 1.1` (Nginx) or equivalent — HTTP/1.0 does not support WebSocket upgrades.
2. `Upgrade` and `Connection` headers are forwarded to the backend.
3. The connection timeout is long enough for idle WebSocket connections (default Nginx timeout of 60s will drop live users).

## Common pitfalls

**`FRONTEND_URL` mismatch** — If email links return 404, the `FRONTEND_URL` in `.env` does not match your public domain. Update it and restart the notification service.

**Mixed content errors** — If you access Bento over HTTPS but the frontend makes requests to `http://...`, check that your proxy sets `X-Forwarded-Proto: https` and that the frontend's API base URL is configured correctly.

**WebSocket 400 / 403** — If the realtime service rejects WebSocket connections, confirm the `Connection` and `Upgrade` headers are being forwarded by your proxy. Some proxies strip them by default.

**Large file uploads time out** — Nginx has a default `client_max_body_size` of 1 MB. Increase it to allow attachment uploads:

```nginx
client_max_body_size 100m;
```
