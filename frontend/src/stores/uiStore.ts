import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface UIStore {
  sidebarCollapsed: boolean
  theme: Theme
  toggleSidebar: () => void
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'dark', // default to dark as user prefers it
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (t) => set({ theme: t }),
    }),
    {
      name: 'bento-ui',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
