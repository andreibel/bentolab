---
title: Backup & Restore
description: How to back up and restore Bento's PostgreSQL, MongoDB, and MinIO data.
outline: [2, 3]
---

# Backup & Restore

Bento stores data in three places: PostgreSQL (relational data), MongoDB (issues, comments, activities), and MinIO (file attachments). A complete backup includes all three.

## What to back up

| Store | Contains | Volume name |
|---|---|---|
| PostgreSQL (auth) | Users, refresh tokens, email verification tokens | `postgres_auth_data` |
| PostgreSQL (org) | Organizations, members, invitations, roles | `postgres_org_data` |
| PostgreSQL (board) | Boards, columns, labels, board members | `postgres_board_data` |
| MongoDB | Issues, sprints, comments, activities, notifications, time logs | `mongo_data` |
| MinIO | Uploaded file attachments | `minio_data` |
| Redis | Sessions, rate-limit keys, stale-token keys | `redis_data` |

Redis data is ephemeral by design — active sessions will be lost on restore, but users simply log in again. Backing up Redis is optional.

## PostgreSQL

Back up each of the three Postgres databases:

```bash
docker compose -f docker-compose.beta.yml exec postgres-auth \
  pg_dump -U $POSTGRES_USER authdb | gzip > backup-auth-$(date +%F).sql.gz

docker compose -f docker-compose.beta.yml exec postgres-org \
  pg_dump -U $POSTGRES_USER orgdb | gzip > backup-org-$(date +%F).sql.gz

docker compose -f docker-compose.beta.yml exec postgres-board \
  pg_dump -U $POSTGRES_USER boarddb | gzip > backup-board-$(date +%F).sql.gz
```

### Restore PostgreSQL

```bash
gunzip -c backup-auth-2026-04-24.sql.gz | \
  docker compose -f docker-compose.beta.yml exec -T postgres-auth \
  psql -U $POSTGRES_USER authdb
```

Repeat for `orgdb` and `boarddb`.

## MongoDB

```bash
docker compose -f docker-compose.beta.yml exec mongo \
  mongodump --username $MONGO_USERNAME --password $MONGO_PASSWORD \
  --authenticationDatabase admin --out /tmp/mongodump

docker cp $(docker compose -f docker-compose.beta.yml ps -q mongo):/tmp/mongodump ./mongodump-$(date +%F)
```

### Restore MongoDB

```bash
docker cp ./mongodump-2026-04-24 \
  $(docker compose -f docker-compose.beta.yml ps -q mongo):/tmp/mongodump

docker compose -f docker-compose.beta.yml exec mongo \
  mongorestore --username $MONGO_USERNAME --password $MONGO_PASSWORD \
  --authenticationDatabase admin /tmp/mongodump
```

## MinIO

The simplest approach is to back up the Docker volume directly:

```bash
docker run --rm \
  -v bento_minio_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/minio-backup-$(date +%F).tar.gz -C /data .
```

Alternatively, use the MinIO Client (`mc`) to sync to another bucket or local directory:

```bash
mc alias set local http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD
mc mirror local/bento-attachments ./minio-backup-$(date +%F)/
```

### Restore MinIO

```bash
docker run --rm \
  -v bento_minio_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/minio-backup-2026-04-24.tar.gz -C /data
```

## Restore

Full restore order:

1. Stop the stack: `docker compose -f docker-compose.beta.yml down`
2. Restore MinIO volume (tar method above)
3. Start infrastructure only: `docker compose -f docker-compose.beta.yml up -d postgres-auth postgres-org postgres-board mongo redis`
4. Restore PostgreSQL databases (see above)
5. Restore MongoDB (see above)
6. Start remaining services: `docker compose -f docker-compose.beta.yml up -d`

## Recommended schedule

| Backup type | Frequency | Retention |
|---|---|---|
| PostgreSQL dump | Daily | 30 days |
| MongoDB dump | Daily | 30 days |
| MinIO snapshot | Weekly | 4 weeks |
| Full volume backup | Weekly | 2 weeks |

Store backups off-site — a different machine, cloud storage, or an external drive. A backup on the same host as the data it protects is not a backup.
