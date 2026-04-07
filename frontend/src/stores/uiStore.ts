import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

export type Theme = 'light' | 'dark'
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
export type TimeFormat = '12h' | '24h'

// 0 = Sunday, 1 = Monday, … 6 = Saturday
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6

interface UIStore {
  // ── Appearance ──────────────────────────────────────────────────────────────
  sidebarCollapsed: boolean
  theme: Theme
  toggleSidebar: () => void
  toggleTheme: () => void
  setTheme: (t: Theme) => void

  // ── Region / calendar ───────────────────────────────────────────────────────
  dateFormat: DateFormat
  timeFormat: TimeFormat
  /** Day the calendar week starts on (0 = Sunday, 1 = Monday, 6 = Saturday) */
  weekStartDay: WeekDay
  /** ISO weekday numbers for working days (0 = Sunday … 6 = Saturday) */
  workingDays: WeekDay[]

  setDateFormat:   (f: DateFormat) => void
  setTimeFormat:   (f: TimeFormat) => void
  setWeekStartDay: (d: WeekDay)    => void
  setWorkingDays:  (d: WeekDay[])  => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // ── Appearance ────────────────────────────────────────────────────────
      sidebarCollapsed: false,
      theme: 'dark',
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleTheme:   () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setTheme:      (t) => set({ theme: t }),

      // ── Region / calendar ──────────────────────────────────────────────────
      dateFormat:   'MM/DD/YYYY',
      timeFormat:   '24h',
      weekStartDay: 1,             // Monday
      workingDays:  [1, 2, 3, 4, 5], // Mon – Fri

      setDateFormat:   (f) => set({ dateFormat: f }),
      setTimeFormat:   (f) => set({ timeFormat: f }),
      setWeekStartDay: (d) => set({ weekStartDay: d }),
      setWorkingDays:  (d) => set({ workingDays: d }),
    }),
    {
      name: 'bento-ui',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
