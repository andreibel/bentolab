---
title: Multi-tenancy
description: How Bento implements multi-tenancy — subdomain routing, single-tenant self-hosting, and data isolation.
outline: [2, 3]
---

# Multi-tenancy

Bento's tenancy model maps one organization to one tenant. All data isolation is enforced by the org ID, which is embedded in every JWT and forwarded by the gateway to all services.

## Cloud (subdomain)

In the cloud deployment, each organization is accessible at `{orgSlug}.bento.io`. The API gateway extracts the subdomain and validates that the JWT's `orgSlug` claim matches. This prevents cross-tenant token reuse.

Subdomain routing requires:
- A wildcard DNS record (`*.bento.io → load balancer`)
- TLS wildcard certificate

## Self-host (single tenant)

The typical self-hosted deployment has one organization and no subdomain routing. All users access the same URL. The org ID is embedded in the JWT and enforced at the service level — if a request's JWT `orgId` does not match a resource's `org_id`, the service returns 403.

Multi-organization self-hosting is supported — a single instance can host multiple organizations. The organization switcher in the UI handles switching between them.

## Path-based fallback

For self-hosted instances where subdomain routing is not available, Bento falls back to path-based tenancy: `bento.example.com/org/{orgSlug}/...`. This requires no DNS changes beyond a single CNAME.

<!-- TODO: confirm with maintainer — whether path-based tenancy is implemented in beta -->

## Data isolation

Data isolation is enforced at multiple layers:

| Layer | Mechanism |
|---|---|
| JWT | `orgId` claim in every token |
| Gateway | Forwards `X-Org-Id` header; services trust it |
| Service layer | Every query includes `WHERE org_id = ?` |
| Database | Each service has its own database (no shared schema) |

There is no row-level security (RLS) in PostgreSQL — isolation is enforced in the application layer. Every repository method in every service filters by `orgId` from the `X-Org-Id` header.
