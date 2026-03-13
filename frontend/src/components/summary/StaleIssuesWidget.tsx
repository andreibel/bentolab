import { Snowflake } from 'lucide-react'

const MOCK = [
  { key: 'TF-15', title: 'Refactor payment module',   daysIdle: 14, assignee: 'MR', color: '#10B981' },
  { key: 'TF-22', title: 'Improve search indexing',   daysIdle: 11, assignee: 'SC', color: '#8B5CF6' },
  { key: 'TF-29', title: 'Add 2FA support',           daysIdle: 9,  assignee: 'AK', color: '#3B82F6' },
  { key: 'TF-31', title: 'Migrate to TypeScript 5.4', daysIdle: 8,  assignee: 'LP', color: '#F59E0B' },
]

export function StaleIssuesWidget({ boardId: _ }: { boardId: string }) {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
        <Snowflake className="h-4 w-4 text-blue-500" />
        <p className="text-xs text-blue-600 dark:text-blue-400">
          {MOCK.length} issues with no updates in 7+ days
        </p>
      </div>
      <div className="flex flex-col divide-y divide-surface-border/50">
        {MOCK.map((item) => (
          <div key={item.key} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: item.color }}
            >
              {item.assignee}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-text-primary">{item.title}</p>
              <p className="text-[10px] text-text-muted"><span className="font-mono">{item.key}</span></p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-500">
              {item.daysIdle}d idle
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
