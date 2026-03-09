import { Timer } from 'lucide-react'
import { FeaturePlaceholder } from '@/components/common/FeaturePlaceholder'

const sprints = [
  { name: 'Sprint 3', board: 'Team Frontend', status: 'ACTIVE',    start: 'Mar 1',  end: 'Mar 14', total: 8,  done: 5, points: 30, donePoints: 18 },
  { name: 'Sprint 2', board: 'Team Frontend', status: 'COMPLETED', start: 'Feb 15', end: 'Feb 28', total: 10, done: 9, points: 28, donePoints: 26 },
  { name: 'Sprint 1', board: 'Team Frontend', status: 'COMPLETED', start: 'Feb 1',  end: 'Feb 14', total: 8,  done: 8, points: 24, donePoints: 24 },
  { name: 'Sprint 1', board: 'Bug Tracker',   status: 'ACTIVE',    start: 'Mar 1',  end: 'Mar 21', total: 12, done: 3, points: 20, donePoints: 5  },
]

const STATUS = {
  ACTIVE:    { label: 'Active',    cls: 'bg-primary-subtle text-primary' },
  PLANNED:   { label: 'Planned',   cls: 'bg-surface-muted text-text-muted' },
  COMPLETED: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700' },
}

function SprintsPreview() {
  return (
    <div>
      <div className="border-b border-surface-border px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">All sprints across boards</p>
      </div>
      <div className="divide-y divide-surface-border">
        {sprints.map((s, i) => {
          const pct = Math.round((s.done / s.total) * 100)
          const st = STATUS[s.status as keyof typeof STATUS]
          return (
            <div key={i} className="grid grid-cols-[1fr_120px_160px_100px] items-center gap-4 px-4 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-text-primary">{s.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                </div>
                <p className="mt-0.5 text-xs text-text-muted">{s.board} · {s.start} → {s.end}</p>
              </div>
              <div className="text-sm text-text-secondary">
                <span className="font-semibold text-text-primary">{s.donePoints}</span>/{s.points} pts
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex h-2 overflow-hidden rounded-full bg-surface-border">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-text-muted">{s.done}/{s.total} issues · {pct}%</p>
              </div>
              <button className="rounded-md border border-surface-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted text-end">
                View →
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SprintsPage() {
  return (
    <FeaturePlaceholder
      icon={Timer}
      title="Sprints"
      description="Overview of all sprints across every board — progress, velocity, and completion rate."
      badge="Coming Soon"
      preview={<SprintsPreview />}
    />
  )
}
