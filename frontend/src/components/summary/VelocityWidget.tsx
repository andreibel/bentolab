import {Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts'

const MOCK = [
  { sprint: 'Sprint 1', points: 34, completed: true },
  { sprint: 'Sprint 2', points: 41, completed: true },
  { sprint: 'Sprint 3', points: 38, completed: true },
  { sprint: 'Sprint 4', points: 52, completed: false },
]
const AVG = Math.round(MOCK.slice(0, 3).reduce((s, d) => s + d.points, 0) / 3)

export function VelocityWidget({ boardId: _ }: { boardId: string }) {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-primary/10 px-3 py-1.5">
          <p className="text-[10px] text-primary">Avg velocity</p>
          <p className="text-xl font-bold text-primary">{AVG} <span className="text-xs font-normal">pts</span></p>
        </div>
        <div className="rounded-lg bg-surface-muted px-3 py-1.5">
          <p className="text-[10px] text-text-muted">Current sprint</p>
          <p className="text-xl font-bold text-text-primary">{MOCK[3].points} <span className="text-xs font-normal">pts</span></p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={MOCK} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" vertical={false} />
            <XAxis dataKey="sprint" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--color-surface-border)', background: 'var(--color-surface)' }}
              itemStyle={{ color: 'var(--color-text-primary)' }}
              formatter={(v) => [`${v} pts`, 'Velocity']}
            />
            <Bar dataKey="points" radius={[4, 4, 0, 0]}>
              {MOCK.map((entry, i) => (
                <Cell key={i} fill={entry.completed ? '#5B47E0' : '#5B47E040'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
