import { CalendarDays, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { FeaturePlaceholder, SkeletonLine } from '@/components/common/FeaturePlaceholder'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKS = 5

const mockEvents: Record<number, { title: string; color: string }[]> = {
  3:  [{ title: 'TF-12 Login page', color: 'bg-primary' }],
  5:  [{ title: 'TF-15 Fix navbar', color: 'bg-accent' }, { title: 'TF-16 Auth tests', color: 'bg-primary' }],
  8:  [{ title: 'TF-18 Dashboard', color: 'bg-emerald-500' }],
  11: [{ title: 'TF-21 API integration', color: 'bg-red-400' }],
  14: [{ title: 'TF-23 Unit tests', color: 'bg-primary' }],
  17: [{ title: 'TF-25 Design review', color: 'bg-accent' }],
  20: [{ title: 'TF-28 Bug fix', color: 'bg-red-400' }, { title: 'TF-29 Deploy', color: 'bg-emerald-500' }],
  24: [{ title: 'TF-31 Sprint review', color: 'bg-primary' }],
}

function CalendarPreview() {
  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <button className="rounded-md border border-surface-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-muted">
            Today
          </button>
          <button className="rounded-md p-1.5 text-text-muted hover:bg-surface-muted">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="rounded-md p-1.5 text-text-muted hover:bg-surface-muted">
            <ChevronRight className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-semibold text-text-primary">March 2026</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-md border border-surface-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-muted">
            <Filter className="h-3.5 w-3.5" />
            All boards
          </button>
          <div className="flex rounded-lg border border-surface-border text-xs font-medium">
            {['Month', 'Week', 'Day'].map((v, i) => (
              <button
                key={v}
                className={`px-3 py-1.5 ${i === 0 ? 'bg-primary-subtle text-primary' : 'text-text-secondary hover:bg-surface-muted'} ${i === 0 ? 'rounded-s-md' : i === 2 ? 'rounded-e-md' : ''}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-surface-border">
        {DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-text-muted">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {Array.from({ length: WEEKS * 7 }).map((_, i) => {
          const day = i - 1 // offset so 1st starts on Mon
          const events = mockEvents[day] ?? []
          const isToday = day === 9
          return (
            <div
              key={i}
              className={`min-h-[90px] border-b border-e border-surface-border p-1.5 last:border-e-0 ${day < 1 || day > 31 ? 'bg-surface-muted/50' : ''}`}
            >
              {day >= 1 && day <= 31 && (
                <>
                  <span className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${isToday ? 'bg-primary text-white' : 'text-text-secondary'}`}>
                    {day}
                  </span>
                  {events.map((e, ei) => (
                    <div
                      key={ei}
                      className={`mb-0.5 truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white ${e.color}`}
                    >
                      {e.title}
                    </div>
                  ))}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-t border-surface-border px-4 py-2.5 text-xs text-text-muted">
        {[
          { color: 'bg-primary', label: 'Story / Task' },
          { color: 'bg-red-400', label: 'Bug' },
          { color: 'bg-accent', label: 'High priority' },
          { color: 'bg-emerald-500', label: 'Done' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function CalendarPage() {
  return (
    <FeaturePlaceholder
      icon={CalendarDays}
      title="Calendar"
      description="See all issues assigned to you laid out as calendar events. Filter by board, type, or priority."
      badge="Coming Soon"
      preview={<CalendarPreview />}
    />
  )
}
