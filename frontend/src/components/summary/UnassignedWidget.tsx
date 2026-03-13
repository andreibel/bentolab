import { UserX } from 'lucide-react'

const MOCK = [
  { key: 'TF-48', title: 'Implement dark mode toggle',   type: 'TASK', priority: 'MEDIUM' },
  { key: 'TF-50', title: 'Write unit tests for auth',    type: 'TASK', priority: 'HIGH'   },
  { key: 'TF-52', title: 'Fix broken image uploads',     type: 'BUG',  priority: 'HIGH'   },
  { key: 'TF-53', title: 'Add CSV export feature',       type: 'STORY',priority: 'LOW'    },
  { key: 'TF-56', title: 'Profile page not responsive',  type: 'BUG',  priority: 'MEDIUM' },
]

const TYPE_COLOR: Record<string, string> = {
  STORY:   'bg-emerald-500/10 text-emerald-600',
  TASK:    'bg-blue-500/10 text-blue-600',
  BUG:     'bg-red-500/10 text-red-600',
  SUBTASK: 'bg-yellow-500/10 text-yellow-600',
}

export function UnassignedWidget({ boardId: _ }: { boardId: string }) {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20 px-3 py-2">
        <UserX className="h-4 w-4 text-yellow-600" />
        <p className="text-xs font-medium text-yellow-700 dark:text-yellow-500">
          {MOCK.length} issues have no assignee
        </p>
      </div>
      <div className="flex flex-col divide-y divide-surface-border/50">
        {MOCK.map((item) => (
          <div key={item.key} className="flex items-center gap-2 py-2 first:pt-0">
            <span className="font-mono text-[10px] text-text-muted w-12 shrink-0">{item.key}</span>
            <span className="flex-1 truncate text-xs text-text-primary">{item.title}</span>
            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${TYPE_COLOR[item.type]}`}>
              {item.type.charAt(0) + item.type.slice(1).toLowerCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
