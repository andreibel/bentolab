import { cn } from '@/utils/cn'

const MOCK = [
  { name: 'To Do',       current: 8,  limit: null, color: '#6B7280' },
  { name: 'In Progress', current: 7,  limit: 5,    color: '#3B82F6' },
  { name: 'In Review',   current: 3,  limit: 4,    color: '#8B5CF6' },
  { name: 'QA',          current: 5,  limit: 3,    color: '#F59E0B' },
  { name: 'Done',        current: 14, limit: null,  color: '#22C55E' },
]

export function WipWidget({ boardId: _ }: { boardId: string }) {
  const violations = MOCK.filter((c) => c.limit != null && c.current > c.limit)

  return (
    <div className="flex h-full flex-col gap-3">
      {violations.length > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-500">
          ⚠ {violations.length} column{violations.length !== 1 ? 's' : ''} exceed WIP limit
        </div>
      )}
      <div className="flex flex-col gap-2">
        {MOCK.map((col) => {
          const exceeded = col.limit != null && col.current > col.limit
          const pct = col.limit ? Math.min(100, (col.current / col.limit) * 100) : 40
          return (
            <div key={col.name} className="flex items-center gap-3">
              <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="w-24 shrink-0 text-xs text-text-primary">{col.name}</span>
              <div className="flex flex-1 items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={cn('h-full rounded-full transition-all', exceeded ? 'bg-red-500' : '')}
                    style={{ width: `${pct}%`, backgroundColor: exceeded ? '#EF4444' : col.color }}
                  />
                </div>
                <span className={cn('w-12 text-end text-xs font-semibold', exceeded ? 'text-red-500' : 'text-text-primary')}>
                  {col.current}{col.limit != null ? `/${col.limit}` : ''}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
