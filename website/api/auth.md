---
title: Auth Service API
description: REST API reference for Bento's auth-service — registration, login, token management, and email verification.
outline: [2, 3]
---

# Auth Service API

Base path: `/api/auth` and `/api/users`

## AuthController

### POST /api/auth/register

Create a new user account and send an email verification link.

**Auth**: public  
**Roles**: —

**Request**:
```json
{
  "firstName": "Alice",
  "lastName": "Smith",
  "email": "alice@example.com",
  "password": "s3cur3passw0rd"
}
```

**Response** `201`:
```json
{
  "message": "Registration successful. Please check your email to verify your account."
}
```

### POST /api/auth/login

Authenticate with email and password. Returns access and refresh tokens.

**Auth**: public  
**Roles**: —

**Request**:
```json
{
  "email": "alice@example.com",
  "password": "s3cur3passw0rd"
}
```

**Response** `200`:
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<uuid>",
  "user": {
    "id": "550e8400-...",
    "email": "alice@example.com",
    "firstName": "Alice",
    "lastName": "Smith"
  }
}
```

### POST /api/auth/refresh

Exchange a refresh token for a new access token and refresh token pair.

**Auth**: public  
**Roles**: —

**Request**:
```json
{
  "refreshToken": "<uuid>",
  "currentOrgId": "6ba7b810-..."
}
```

**Response** `200`: same shape as login response.

### POST /api/auth/logout

Revoke the current refresh token.

**Auth**: required  
**Roles**: any

**Request**:
```json
{ "refreshToken": "<uuid>" }
```

**Response** `204`: no body.

### POST /api/auth/switch-org

Switch the JWT context to a different organization.

**Auth**: required  
**Roles**: must be member of target org

**Request**:
```json
{ "orgId": "6ba7b810-..." }
```

**Response** `200`: new `accessToken` and `refreshToken`.

### POST /api/auth/switch-org-by-slug

Switch org context by slug instead of ID.

**Auth**: required  
**Roles**: must be member of target org

**Request**:
```json
{ "orgSlug": "acme" }
```

**Response** `200`: new `accessToken` and `refreshToken`.

### GET /api/auth/verify-email

Verify an email address using the token from the verification email.

**Auth**: public  
**Roles**: —

**Query params**: `token=<verification-token>`

**Response** `200`:
```json
{ "message": "Email verified successfully." }
```

### POST /api/auth/resend-verification

Request a new verification email.

**Auth**: public  
**Roles**: —

**Request**:
```json
{ "email": "alice@example.com" }
```

**Response** `200`: always succeeds (no user enumeration).

### POST /api/auth/forgot-password

Request a password reset link by email.

**Auth**: public  
**Roles**: —

**Request**:
```json
{ "email": "alice@example.com" }
```

**Response** `200`: always succeeds (no user enumeration).

### POST /api/auth/reset-password

Reset password using the token from the reset email.

**Auth**: public  
**Roles**: —

**Request**:
```json
{
  "token": "<reset-token>",
  "newPassword": "newS3cur3pass"
}
```

**Response** `200`:
```json
{ "message": "Password reset successfully." }
```

## UserController

### GET /api/users/me

Get the authenticated user's profile.

**Auth**: required  
**Roles**: any

**Response** `200`:
```json
{
  "id": "550e8400-...",
  "email": "alice@example.com",
  "firstName": "Alice",
  "lastName": "Smith",
  "avatarUrl": null,
  "locale": "en",
  "timezone": "UTC"
}
```

### PATCH /api/users/me

Update the authenticated user's profile.

**Auth**: required  
**Roles**: any

**Request**:
```json
{
  "firstName": "Alice",
  "lastName": "Smith",
  "locale": "he",
  "timezone": "Asia/Jerusalem"
}
```

**Response** `200`: updated user object.

### POST /api/users/batch

Fetch multiple users by ID. Used internally by the frontend to resolve assignee names.

**Auth**: required  
**Roles**: any

**Request**:
```json
{ "userIds": ["550e8400-...", "6ba7b810-..."] }
```

**Response** `200`: array of user objects.
