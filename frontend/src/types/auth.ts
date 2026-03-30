export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  systemRole: string
  emailVerified: boolean
  currentOrgId: string | null
  timezone: string
  locale: string
  lastLoginAt: string | null
  createdAt: string
}

export interface UserOrg {
  orgId: string
  orgName: string
  orgSlug: string
  orgRole: string
  logoUrl: string | null
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
  organizations: UserOrg[]
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
}
