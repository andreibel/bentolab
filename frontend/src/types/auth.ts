export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  systemRole: string
  isEmailVerified: boolean
  currentOrgId: string | null
  timezone: string
  locale: string
  lastLoginAt: string | null
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
}
