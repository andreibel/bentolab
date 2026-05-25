---
title: Requirements
description: Hardware, OS, software, and network requirements for self-hosting Bento.
outline: [2, 3]
---

# Requirements

## Hardware

| Profile | CPU (minimum) | RAM (minimum) | Disk |
|---|---|---|---|
| `selfhost` | 2 cores | 3 GB | 20 GB |
| `minimal` | 1 core | 2.4 GB | 10 GB |
| `cloud` | 4 cores | 4 GB | Managed |

Disk usage grows with attachments stored in MinIO. Budget storage based on your team's expected file volume.

## Operating system

Bento runs on any Linux distribution that supports Docker. Tested on:

- Ubuntu 22.04 / 24.04
- Debian 12
- Raspberry Pi OS (Bookworm, 64-bit)
- macOS via Docker Desktop (development only)
- Windows via Docker Desktop + WSL2 (development only)

::: warning 32-bit
All images are 64-bit only (`amd64` and `arm64`). 32-bit ARM is not supported.
:::

## Software

| Package | Minimum version | Notes |
|---|---|---|
| Docker Engine | 24.0 | Or Docker Desktop 4.25+ |
| Docker Compose plugin | 2.20 | `docker compose` (not `docker-compose`) |
| `curl` | any | For downloading compose files |
| `openssl` | any | For generating secrets |

## Network & ports

These ports must be free on the host before starting Bento:

| Port | Service | Exposed to |
|---|---|---|
| 3000 | Frontend | Users |
| 8080 | API Gateway | Users / reverse proxy |
| 8025 | MailHog web UI | Operators (dev only) |
| 9001 | MinIO console | Operators |
| 5432 | PostgreSQL | Internal only |
| 27017 | MongoDB | Internal only |
| 6379 | Redis | Internal only |
| 29092 | Kafka broker | Internal only |
| 8081 | auth-service | Internal only |
| 8082 | org-service | Internal only |
| 8083 | board-service | Internal only |
| 8084 | task-service | Internal only |
| 8085 | notification-service | Internal only |
| 8086 | realtime-service | Internal only |
| 8087 | attachment-service | Internal only |

In production, expose only ports 3000 and 8080 (or 443 if behind a reverse proxy). All other ports should be firewalled.

## Supported architectures

| Architecture | Support |
|---|---|
| `linux/amd64` | Fully supported |
| `linux/arm64` | Fully supported (Raspberry Pi 4/5, Apple Silicon) |
| `linux/arm/v7` | Not supported |
| `windows/amd64` | Via Docker Desktop / WSL2 only |
