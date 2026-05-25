---
title: Updates
description: How to update Bento to a new version using Docker Compose.
outline: [2, 3]
---

# Updates

Bento uses semantic-style version tags on Docker Hub. Update by pulling new images and restarting the stack — data volumes are preserved.

## Version scheme

Bento uses pre-release tags during beta: `v0.1.1-beta-4`, `v0.1.1-beta-3-hotfix`, and so on. The current release is **v0.1.1-beta-4**. Check the [Changelog](../changelog.md) for what changed between versions.

## Pulling new images

When a new version is released, update the image tags in `docker-compose.beta.yml` from the old tag to the new one:

```bash
# Before editing: change all occurrences of the old tag to the new tag
sed -i 's/v0.1.1-beta-4/v0.1.1-beta-5/g' docker-compose.beta.yml
```

Then pull the new images and restart:

```bash
docker compose -f docker-compose.beta.yml pull
docker compose -f docker-compose.beta.yml up -d
```

Compose replaces only the containers whose images have changed. Infrastructure containers (Postgres, Mongo, Redis, Kafka) are not pulled because they use upstream images, not Bento images.

## Migrations

Database schema migrations run automatically when the application services start. Bento uses Flyway for PostgreSQL migrations. MongoDB schema changes are handled by the application layer. You do not need to run migrations manually.

::: warning Back up before upgrading
Always take a backup before upgrading to a new version. See [Backup & Restore](./backup.md). If a migration fails mid-way, you need the backup to recover.
:::

## Rollback

To roll back to the previous version:

1. Stop the stack: `docker compose -f docker-compose.beta.yml down`
2. Restore your database backup from before the upgrade (see [Backup & Restore](./backup.md)).
3. Change the image tags back to the previous version in `docker-compose.beta.yml`.
4. Start the stack: `docker compose -f docker-compose.beta.yml up -d`

::: danger
Rolling back is only safe if you restore the database backup. Running an older application image against a schema migrated to a newer version will cause errors.
:::
