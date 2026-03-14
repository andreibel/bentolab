import {Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts'

const MOCK = [
  { column: 'To Do',       avgDays: 1.2, color: '#6B7280' },
  { column: 'In Progress', avgDays: 3.8, color: '#3B82F6' },
  { column: 'In Review',   avgDays: 1.5, color: '#8B5CF6' },
  { column: 'QA',          avgDays: 0.9, color: '#F59E0B' },
  { column: 'Done',        avgDays: 0.2, color: '#22C55E' },
]

export function CycleTimeWidget({ boardId: _ }: { boardId: string }) {
  const total = MOCK.reduce((s, d) => s + d.avgDays, 0).toFixed(1)
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">Avg total cycle time:</span>
        <span className="text-sm font-bold text-text-primary">{total} days</span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={MOCK} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} unit=" d" />
            <YAxis type="category" dataKey="column" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={70} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--color-surface-border)', background: 'var(--color-surface)' }}
              itemStyle={{ color: 'var(--color-text-primary)' }}
              formatter={(v) => [`${v} days`, 'Avg time']}
            />
            <Bar dataKey="avgDays" radius={[0, 4, 4, 0]}>
              {MOCK.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
