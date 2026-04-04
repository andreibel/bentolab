import client from './client'
import type {AuthResponse, User} from '@/types/auth'

export const authApi = {
  login: (email: string, password: string, orgSlug?: string) =>
    client.post<AuthResponse>('/api/auth/login', { email, password, orgSlug }).then((r) => r.data),

  register: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => client.post<AuthResponse>('/api/auth/register', data).then((r) => r.data),

  logout: (refreshToken: string) =>
    client.post('/api/auth/logout', { refreshToken }),

  switchOrg: (orgId: string) =>
    client.post<{ accessToken: string }>('/api/auth/switch-org', { orgId }).then((r) => r.data),

  me: () => client.get<User>('/api/users/me').then((r) => r.data),

  forgotPassword: (email: string) =>
    client.post('/api/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    client.post('/api/auth/reset-password', { token, newPassword }),

  verifyEmail: (token: string) =>
    client.get('/api/auth/verify-email', { params: { token } }),

  resendVerification: (email: string) =>
    client.post('/api/auth/resend-verification', { email }),
}
