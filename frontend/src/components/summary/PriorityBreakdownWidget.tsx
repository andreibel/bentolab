import {PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip} from 'recharts'

const MOCK = [
  { priority: 'Critical', count: 4,  color: '#EF4444' },
  { priority: 'High',     count: 11, color: '#F97316' },
  { priority: 'Medium',   count: 18, color: '#EAB308' },
  { priority: 'Low',      count: 7,  color: '#3B82F6' },
]

export function PriorityBreakdownWidget({ boardId: _ }: { boardId: string }) {
  const total = MOCK.reduce((s, d) => s + d.count, 0)
  return (
    <div className="flex h-full items-center gap-4">
      <div className="flex flex-1 flex-col gap-2">
        {MOCK.map((d) => (
          <div key={d.priority} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
            <span className="flex-1 text-xs text-text-muted">{d.priority}</span>
            <div className="flex w-24 items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-surface-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(d.count / total) * 100}%`, backgroundColor: d.color }}
                />
              </div>
              <span className="w-5 text-end text-xs font-semibold text-text-primary">{d.count}</span>
            </div>
          </div>
        ))}
        <div className="mt-1 border-t border-surface-border pt-1">
          <span className="text-xs text-text-muted">Total: <strong className="text-text-primary">{total} issues</strong></span>
        </div>
      </div>
      <div className="h-28 w-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={MOCK.map((d) => ({ subject: d.priority, value: d.count }))}>
            <PolarGrid stroke="var(--color-surface-border)" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: 'var(--color-text-muted)' }} />
            <Radar dataKey="value" stroke="#5B47E0" fill="#5B47E0" fillOpacity={0.3} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--color-surface-border)', background: 'var(--color-surface)' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
