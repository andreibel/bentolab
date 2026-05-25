---
title: Commit Conventions
description: Conventional Commits format used in the Bento project.
outline: [2, 3]
---

# Commit Conventions

Bento uses [Conventional Commits](https://www.conventionalcommits.org/). Every commit message must follow this format:

```
<type>(<scope>): <short description>

[optional body]
```

The short description is present tense, lowercase, no trailing period. The body explains the *why*, not the *what*.

## Conventional Commits

| Type | When to use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `refactor` | Code change that is not a fix or feature |
| `test` | Adding or modifying tests |
| `chore` | Tooling, dependencies, CI configuration |
| `perf` | Performance improvement |
| `style` | Formatting, whitespace — no logic change |

## Examples

```
feat(auth): add forgot-password flow with email token
fix(task-service): prevent duplicate sprint creation on rapid submit
docs(readme): update deploy steps for beta-4
chore(deps): upgrade vitepress to 1.5.0
refactor(org-service): remove redundant db membership checks
test(auth-service): add integration tests for email verification
```

## Scope naming

Use the service or area name as the scope:

| Scope | Area |
|---|---|
| `auth` | auth-service |
| `org` | org-service |
| `board` | board-service |
| `task` | task-service |
| `notification` | notification-service |
| `realtime` | realtime-service |
| `attachment` | attachment-service |
| `gateway` | api-gateway |
| `frontend` | React application |
| `infra` | Terraform, Kubernetes, Docker |
| `docs` | Documentation |
| `deps` | Dependency upgrades |
