import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'
import axios from 'axios'
import type {User} from '@/types/auth'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

// Parse JWT payload for display purposes only (not for auth decisions)
function parseJwt(token: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return {}
  }
}

interface AuthState {
  isInitialized: boolean
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  currentOrgId: string | null
  orgRole: string | null
  orgSlug: string | null
  orgName: string | null
}

interface AuthActions {
  initialize: () => Promise<void>
  setAuth: (data: { accessToken: string; refreshToken: string; user: User }) => void
  setTokens: (access: string, refresh: string) => void
  setOrgContext: (orgId: string, orgRole: string, orgSlug: string, accessToken: string, orgName?: string) => void
  refresh: () => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      isInitialized: false,
      accessToken: null,
      refreshToken: null,
      user: null,
      currentOrgId: null,
      orgRole: null,
      orgSlug: null,
      orgName: null,

      initialize: async () => {
        const { refreshToken, accessToken } = get()
        if (refreshToken && !accessToken) {
          try {
            await get().refresh()
          } catch {
            get().logout()
          }
        }
        set({ isInitialized: true })
      },

      setAuth: ({ accessToken, refreshToken, user }) => {
        // Extract org context from JWT (display only)
        const payload = parseJwt(accessToken)
        set({
          accessToken,
          refreshToken,
          user,
          currentOrgId: (payload.orgId as string) ?? user.currentOrgId ?? null,
          orgRole:      (payload.orgRole as string) ?? null,
          orgSlug:      (payload.orgSlug as string) ?? null,
        })
      },

      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),

      setOrgContext: (orgId, _orgRole, orgSlug, accessToken, orgName) => {
        const payload = parseJwt(accessToken)
        set({
          currentOrgId: orgId,
          orgRole:      (payload.orgRole as string) ?? _orgRole ?? null,
          orgSlug:      (payload.orgSlug as string) ?? orgSlug,
          accessToken,
          orgName:      orgName ?? null,
        })
      },

      refresh: async () => {
        const { refreshToken, currentOrgId } = get()
        if (!refreshToken) throw new Error('No refresh token')
        const res = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken,
          currentOrgId,
        })
        const payload = parseJwt(res.data.accessToken)
        set({
          accessToken:  res.data.accessToken,
          refreshToken: res.data.refreshToken,
          orgRole:      (payload.orgRole as string) ?? get().orgRole,
          orgSlug:      (payload.orgSlug as string) ?? get().orgSlug,
          currentOrgId: (payload.orgId  as string) ?? get().currentOrgId,
        })
      },

      logout: () =>
        set({
          isInitialized: true, // stay initialized so ProtectedRoute redirects instead of spinning
          accessToken: null,
          refreshToken: null,
          user: null,
          currentOrgId: null,
          orgRole: null,
          orgSlug: null,
          orgName: null,
        }),
    }),
    {
      name: 'bento-auth',
      storage: createJSONStorage(() => localStorage),
      // accessToken stays in memory only; everything else persists for UX
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user:         state.user,
        currentOrgId: state.currentOrgId,
        orgRole:      state.orgRole,
        orgSlug:      state.orgSlug,
        orgName:      state.orgName,
      }),
    }
  )
)
