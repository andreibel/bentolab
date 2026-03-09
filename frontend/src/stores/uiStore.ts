import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UIStore {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: 'bento-ui',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
