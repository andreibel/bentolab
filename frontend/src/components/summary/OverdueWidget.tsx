import {AlertCircle} from 'lucide-react'
import {cn} from '@/utils/cn'

const MOCK = [
  { key: 'TF-12', title: 'Update payment gateway',     daysLate: 8,  assignee: 'AK', color: '#3B82F6', priority: 'HIGH'     },
  { key: 'TF-27', title: 'Fix session timeout bug',    daysLate: 5,  assignee: 'MR', color: '#10B981', priority: 'CRITICAL'  },
  { key: 'TF-35', title: 'Write API docs for v2',      daysLate: 3,  assignee: 'SC', color: '#8B5CF6', priority: 'MEDIUM'    },
  { key: 'TF-41', title: 'Migrate to new DB schema',   daysLate: 11, assignee: 'DN', color: '#EF4444', priority: 'HIGH'      },
]

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-500',
  HIGH:     'bg-orange-500/10 text-orange-500',
  MEDIUM:   'bg-yellow-500/10 text-yellow-600',
  LOW:      'bg-blue-500/10 text-blue-500',
}

export function OverdueWidget({ boardId: _ }: { boardId: string }) {
  return (
    <div className="flex h-full flex-col gap-0 divide-y divide-surface-border/50">
      {MOCK.map((item) => (
        <div key={item.key} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-text-primary">{item.title}</p>
            <p className="text-[10px] text-text-muted"><span className="font-mono">{item.key}</span> · {item.daysLate}d overdue</p>
          </div>
          <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold', PRIORITY_COLOR[item.priority])}>
            {item.priority.charAt(0) + item.priority.slice(1).toLowerCase()}
          </span>
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: item.color }}
          >
            {item.assignee}
          </div>
        </div>
      ))}
    </div>
  )
}
