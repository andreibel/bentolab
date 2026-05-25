---
title: Pull Requests
description: Branch naming, PR template, review checklist, and merge policy for Bento contributions.
outline: [2, 3]
---

# Pull Requests

## Branch naming

| Prefix | Use for |
|---|---|
| `feature/` | New features (`feature/sprint-close-report`) |
| `fix/` | Bug fixes (`fix/stale-token-redis-ttl`) |
| `chore/` | Tooling, dependencies, docs (`chore/upgrade-vitepress`) |

Branch names are lowercase, words separated by hyphens. Include the affected service if applicable: `fix/auth-service-email-verification`.

## PR template

When opening a PR, include:

```markdown
## What
A brief description of what changed.

## Why
The motivation — what bug does this fix, what feature does this add?

## Testing
How was this tested? Unit tests? Integration tests? Manual steps?

## Checklist
- [ ] Tests pass locally (`./gradlew test` / `npm run test`)
- [ ] No new linting errors
- [ ] Conventional commit message on all commits
- [ ] Documentation updated if behavior changed
```

## Review checklist

Reviewers check for:

- No security regressions (SQL injection, XSS, secrets in logs)
- Database queries filtered by `orgId` in all service-layer methods
- No cross-service direct database access
- Kafka events published where state changes affect other services
- RTL support for any new UI component (`rtl:` / `ltr:` Tailwind variants, logical properties)
- Tests cover the happy path and at least one edge case

## Squash merge policy

All PRs are squash-merged to `main`. The squash commit message must follow Conventional Commits. The PR title becomes the squash message — set it accordingly before merging.

Feature branches are deleted after merge. Do not reuse branches.
