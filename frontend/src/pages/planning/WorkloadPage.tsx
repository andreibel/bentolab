import {Users2} from 'lucide-react'
import {FeaturePlaceholder} from '@/components/common/FeaturePlaceholder'

const members = [
  { name: 'Alex Kim',    initials: 'AK', color: 'bg-primary',     assigned: 8,  capacity: 10, issues: ['TF-12', 'TF-18', 'TF-24'] },
  { name: 'Sara Levi',  initials: 'SL', color: 'bg-emerald-500', assigned: 12, capacity: 10, issues: ['TF-15', 'TF-20', 'TF-31'] },
  { name: 'Mark Chen',  initials: 'MC', color: 'bg-accent',      assigned: 5,  capacity: 10, issues: ['TF-8', 'TF-9'] },
  { name: 'Julia Rosa', initials: 'JR', color: 'bg-violet-500',  assigned: 10, capacity: 10, issues: ['TF-22', 'TF-29', 'TF-33'] },
  { name: 'David Park', initials: 'DP', color: 'bg-sky-500',     assigned: 3,  capacity: 10, issues: ['TF-41'] },
]

function WorkloadPreview() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <p className="text-sm font-medium text-text-secondary">
          Sprint 3 · Mar 1 – Mar 14
        </p>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary/30" />Under capacity</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/70" />On track</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-400" />Overloaded</span>
        </div>
      </div>

      <div className="divide-y divide-surface-border">
        {members.map((m) => {
          const pct = Math.round((m.assigned / m.capacity) * 100)
          const barColor = pct > 100 ? 'bg-red-400' : pct >= 80 ? 'bg-emerald-500' : 'bg-primary/40'
          return (
            <div key={m.name} className="grid grid-cols-[200px_1fr_120px] items-center gap-4 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${m.color}`}>
                  {m.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{m.name}</p>
                  <p className="text-xs text-text-muted">{m.assigned} issues</p>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex h-4 overflow-hidden rounded-full bg-surface-border">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="flex gap-1">
                  {m.issues.slice(0, 5).map((key) => (
                    <span key={key} className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
                      {key}
                    </span>
                  ))}
                  {m.assigned > 3 && (
                    <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-text-muted">
                      +{m.assigned - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="text-end">
                <span className={`text-sm font-semibold ${pct > 100 ? 'text-red-500' : 'text-text-primary'}`}>
                  {pct}%
                </span>
                <p className="text-xs text-text-muted">{m.assigned}/{m.capacity} capacity</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function WorkloadPage() {
  return (
    <FeaturePlaceholder
      icon={Users2}
      title="Workload"
      description="See who's overloaded and who has capacity. Balance sprint work across your team."
      badge="Coming Soon"
      preview={<WorkloadPreview />}
    />
  )
}
