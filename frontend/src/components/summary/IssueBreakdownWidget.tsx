import {Cell, Pie, PieChart, ResponsiveContainer, Tooltip} from 'recharts'

const MOCK_TYPES = [
  { name: 'Story',   value: 18, color: '#10B981' },
  { name: 'Task',    value: 32, color: '#3B82F6' },
  { name: 'Bug',     value: 11, color: '#EF4444' },
  { name: 'Subtask', value: 9,  color: '#F59E0B' },
]

const MOCK_STATUS = [
  { name: 'Open',        value: 28, color: '#6B7280' },
  { name: 'In Progress', value: 14, color: '#3B82F6' },
  { name: 'Done',        value: 28, color: '#22C55E' },
]

export function IssueBreakdownWidget({ boardId: _ }: { boardId: string }) {
  const total = MOCK_TYPES.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex h-full flex-col gap-3">
      {/* By type */}
      <div className="flex-1 min-h-0">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">By type</p>
        <div className="flex items-center gap-2">
          <ResponsiveContainer width="50%" height={120}>
            <PieChart>
              <Pie
                data={MOCK_TYPES}
                cx="50%" cy="50%"
                innerRadius={32} outerRadius={52}
                dataKey="value"
                strokeWidth={2}
                stroke="var(--color-surface)"
              >
                {MOCK_TYPES.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--color-surface-border)', background: 'var(--color-surface)' }}
                itemStyle={{ color: 'var(--color-text-primary)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5">
            {MOCK_TYPES.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-text-muted">{d.name}</span>
                <span className="ms-auto text-xs font-semibold text-text-primary">{d.value}</span>
                <span className="text-[10px] text-text-muted w-8 text-end">{Math.round((d.value / total) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-surface-border" />

      {/* By status */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">By status</p>
        <div className="flex gap-1 h-2 rounded-full overflow-hidden">
          {MOCK_STATUS.map((s) => (
            <div
              key={s.name}
              title={`${s.name}: ${s.value}`}
              style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
            />
          ))}
        </div>
        <div className="mt-2 flex gap-4">
          {MOCK_STATUS.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-text-muted">{s.name}</span>
              <span className="text-xs font-semibold text-text-primary">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
