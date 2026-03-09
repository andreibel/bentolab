import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import axios from 'axios'
import type { User } from '@/types/auth'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  currentOrgId: string | null
  orgRole: string | null
  orgSlug: string | null
}

interface AuthActions {
  setAuth: (data: { accessToken: string; refreshToken: string; user: User }) => void
  setTokens: (access: string, refresh: string) => void
  setOrgContext: (orgId: string, orgRole: string, orgSlug: string, accessToken: string) => void
  refresh: () => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      currentOrgId: null,
      orgRole: null,
      orgSlug: null,

      setAuth: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user, currentOrgId: user.currentOrgId }),

      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),

      setOrgContext: (orgId, orgRole, orgSlug, accessToken) =>
        set({ currentOrgId: orgId, orgRole, orgSlug, accessToken }),

      refresh: async () => {
        const { refreshToken, currentOrgId } = get()
        if (!refreshToken) throw new Error('No refresh token')
        const res = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken,
          currentOrgId,
        })
        set({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken })
      },

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          currentOrgId: null,
          orgRole: null,
          orgSlug: null,
        }),
    }),
    {
      name: 'bento-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist the refresh token — access token stays in memory
      partialize: (state) => ({ refreshToken: state.refreshToken }),
    }
  )
)
