import {CheckCircle2, Clock, Target} from 'lucide-react'
import {cn} from '@/utils/cn'

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK = {
  name:         'Sprint 4',
  startDate:    '2026-03-10',
  endDate:      '2026-03-24',
  totalIssues:  24,
  doneIssues:   14,
  totalPoints:  89,
  donePoints:   52,
  daysTotal:    14,
  daysLeft:     6,
  columns: [
    { name: 'To Do',       count: 4,  color: '#6B7280' },
    { name: 'In Progress', count: 6,  color: '#3B82F6' },
    { name: 'In Review',   count: 2,  color: '#8B5CF6' },
    { name: 'Done',        count: 12, color: '#22C55E' },
  ],
}

function ProgressBar({ value, color = 'bg-primary', className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-muted', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', color)}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  )
}

export function SprintHealthWidget({ boardId: _ }: { boardId: string }) {
  const issueProgress = Math.round((MOCK.doneIssues / MOCK.totalIssues) * 100)
  const pointProgress = Math.round((MOCK.donePoints / MOCK.totalPoints) * 100)
  const timeProgress  = Math.round(((MOCK.daysTotal - MOCK.daysLeft) / MOCK.daysTotal) * 100)

  // Health: if time% >> issue%, we're behind
  const health = issueProgress >= timeProgress - 10 ? 'on-track' : issueProgress >= timeProgress - 25 ? 'at-risk' : 'behind'

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Sprint name + health */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-bold text-text-primary">{MOCK.name}</p>
          <p className="text-xs text-text-muted">{MOCK.startDate} – {MOCK.endDate}</p>
        </div>
        <span className={cn(
          'rounded-full px-2.5 py-1 text-xs font-semibold',
          health === 'on-track' ? 'bg-green-500/10 text-green-600' :
          health === 'at-risk'  ? 'bg-yellow-500/10 text-yellow-600' :
                                  'bg-red-500/10 text-red-500',
        )}>
          {health === 'on-track' ? '✓ On track' : health === 'at-risk' ? '⚠ At risk' : '✗ Behind'}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1 rounded-lg bg-surface-muted p-3">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Issues
          </div>
          <p className="text-lg font-bold text-text-primary">{MOCK.doneIssues}<span className="text-sm font-normal text-text-muted">/{MOCK.totalIssues}</span></p>
          <ProgressBar value={issueProgress} color="bg-green-500" />
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-surface-muted p-3">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Target className="h-3.5 w-3.5" />
            Points
          </div>
          <p className="text-lg font-bold text-text-primary">{MOCK.donePoints}<span className="text-sm font-normal text-text-muted">/{MOCK.totalPoints}</span></p>
          <ProgressBar value={pointProgress} color="bg-primary" />
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-surface-muted p-3">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Clock className="h-3.5 w-3.5" />
            Days left
          </div>
          <p className="text-lg font-bold text-text-primary">{MOCK.daysLeft}<span className="text-sm font-normal text-text-muted">/{MOCK.daysTotal}</span></p>
          <ProgressBar value={timeProgress} color="bg-orange-400" />
        </div>
      </div>

      {/* Column distribution */}
      <div>
        <p className="mb-2 text-xs font-medium text-text-muted uppercase tracking-wide">By column</p>
        <div className="flex gap-1 rounded-lg overflow-hidden h-3">
          {MOCK.columns.map((col) => (
            <div
              key={col.name}
              title={`${col.name}: ${col.count}`}
              style={{
                width: `${(col.count / MOCK.totalIssues) * 100}%`,
                backgroundColor: col.color,
              }}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-3">
          {MOCK.columns.map((col) => (
            <div key={col.name} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-xs text-text-muted">{col.name}</span>
              <span className="text-xs font-semibold text-text-primary">{col.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
