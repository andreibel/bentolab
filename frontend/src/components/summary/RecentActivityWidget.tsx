const MOCK = [
  { user: 'AK', color: '#3B82F6', action: 'closed',   issue: 'TF-42', title: 'Fix login redirect',        time: '2m ago' },
  { user: 'SC', color: '#8B5CF6', action: 'commented', issue: 'TF-38', title: 'Dashboard performance',     time: '14m ago' },
  { user: 'MR', color: '#10B981', action: 'moved',     issue: 'TF-51', title: 'Add export CSV feature',    time: '1h ago' },
  { user: 'LP', color: '#F59E0B', action: 'created',   issue: 'TF-55', title: 'Mobile layout broken on iOS', time: '2h ago' },
  { user: 'DN', color: '#EF4444', action: 'assigned',  issue: 'TF-33', title: 'Refactor auth service',     time: '3h ago' },
  { user: 'AK', color: '#3B82F6', action: 'created',   issue: 'TF-54', title: 'Update onboarding flow',   time: '5h ago' },
]

const ACTION_COLOR: Record<string, string> = {
  closed:   'text-green-600',
  commented:'text-blue-500',
  moved:    'text-purple-500',
  created:  'text-primary',
  assigned: 'text-yellow-600',
}

export function RecentActivityWidget({ boardId: _ }: { boardId: string }) {
  return (
    <div className="flex flex-col gap-0 divide-y divide-surface-border/50">
      {MOCK.map((item, i) => (
        <div key={i} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
          <div
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: item.color }}
          >
            {item.user}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-text-primary">
              <span className={`font-medium ${ACTION_COLOR[item.action] ?? ''}`}>{item.action}</span>
              {' · '}
              <span className="font-mono text-text-muted">{item.issue}</span>
              {' '}
              {item.title}
            </p>
          </div>
          <span className="shrink-0 text-[10px] text-text-muted">{item.time}</span>
        </div>
      ))}
    </div>
  )
}
