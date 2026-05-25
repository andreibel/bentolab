---
title: Org Service API
description: REST API reference for Bento's org-service — organizations, members, and invitations.
outline: [2, 3]
---

# Org Service API

Base path: `/api/orgs`, `/api/invitations`

## OrgController

### POST /api/orgs

Create a new organization.

**Auth**: required  
**Roles**: any authenticated user

**Request**:
```json
{
  "name": "Acme",
  "slug": "acme"
}
```

**Response** `201`:
<!-- TODO: schema -->

### GET /api/orgs/me

List all organizations the authenticated user belongs to.

**Auth**: required  
**Roles**: any

**Response** `200`: array of organization objects.

### GET /api/orgs/{orgId}

Get a single organization by ID.

**Auth**: required  
**Roles**: any member

**Response** `200`: organization object.

### PATCH /api/orgs/{orgId}

Update organization name, slug, or logo.

**Auth**: required  
**Roles**: OWNER

**Request**:
```json
{ "name": "Acme Inc", "slug": "acme-inc" }
```

**Response** `200`: updated organization object.

### DELETE /api/orgs/{orgId}

Delete the organization permanently.

**Auth**: required  
**Roles**: OWNER

**Response** `204`: no body.

### POST /api/orgs/{orgId}/transfer

Transfer OWNER role to another member.

**Auth**: required  
**Roles**: OWNER

**Request**:
```json
{ "newOwnerId": "550e8400-..." }
```

**Response** `200`: updated organization object.

## MemberController

### GET /api/orgs/{orgId}/members

List all members of an organization.

**Auth**: required  
**Roles**: any member

**Response** `200`: array of member objects with role.

### PATCH /api/orgs/{orgId}/members/{userId}/role

Change a member's role.

**Auth**: required  
**Roles**: OWNER (any role), ADMIN (MEMBER and VIEWER only)

**Request**:
```json
{ "role": "ADMIN" }
```

**Response** `200`: updated member object.

### DELETE /api/orgs/{orgId}/members/{userId}

Remove a member from the organization.

**Auth**: required  
**Roles**: OWNER or ADMIN (cannot remove OWNER)

**Response** `204`: no body.

## InvitationController

### POST /api/orgs/{orgId}/invitations

Send email invitations to one or more addresses.

**Auth**: required  
**Roles**: OWNER or ADMIN

**Request**:
```json
{
  "emails": ["bob@example.com", "carol@example.com"],
  "role": "MEMBER"
}
```

**Response** `201`: array of created invitation objects.

### GET /api/orgs/{orgId}/invitations

List all pending invitations.

**Auth**: required  
**Roles**: OWNER or ADMIN

**Response** `200`: array of invitation objects.

### DELETE /api/orgs/{orgId}/invitations/{invitationId}

Revoke a pending invitation.

**Auth**: required  
**Roles**: OWNER or ADMIN

**Response** `204`: no body.

### GET /api/invitations/{token}/preview

Get invitation details without accepting (for the accept page UI).

**Auth**: public  
**Roles**: —

**Response** `200`:
```json
{
  "orgName": "Acme",
  "orgSlug": "acme",
  "inviterName": "Alice Smith",
  "role": "MEMBER"
}
```

### POST /api/invitations/{token}/accept

Accept an invitation and join the organization.

**Auth**: public (creates account if not logged in)  
**Roles**: —

**Response** `200`: `{ accessToken, refreshToken, user }` — same as login.
