const MOCK = [
  { title: 'Authentication',     total: 12, done: 10, color: '#3B82F6' },
  { title: 'Dashboard redesign', total: 8,  done: 3,  color: '#8B5CF6' },
  { title: 'Mobile API',         total: 15, done: 7,  color: '#10B981' },
  { title: 'Reporting',          total: 6,  done: 6,  color: '#F59E0B' },
  { title: 'Notifications',      total: 9,  done: 2,  color: '#EF4444' },
]

export function EpicProgressWidget({ boardId: _ }: { boardId: string }) {
  return (
    <div className="flex h-full flex-col gap-3">
      {MOCK.map((epic) => {
        const pct = Math.round((epic.done / epic.total) * 100)
        return (
          <div key={epic.title}>
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: epic.color }} />
                <span className="text-xs font-medium text-text-primary">{epic.title}</span>
              </div>
              <span className="text-xs text-text-muted">{epic.done}/{epic.total} · {pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: epic.color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
