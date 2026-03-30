import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts'

const MOCK = [
  { week: 'W1', opened: 5,  closed: 2  },
  { week: 'W2', opened: 8,  closed: 5  },
  { week: 'W3', opened: 3,  closed: 7  },
  { week: 'W4', opened: 6,  closed: 4  },
  { week: 'W5', opened: 4,  closed: 6  },
]

export function BugRateWidget({ boardId: _ }: { boardId: string }) {
  const totalOpen   = MOCK.reduce((s, d) => s + d.opened, 0)
  const totalClosed = MOCK.reduce((s, d) => s + d.closed, 0)
  const resolutionRate = Math.round((totalClosed / totalOpen) * 100)

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-red-500/10 px-3 py-1.5">
          <p className="text-[10px] text-red-500">Opened</p>
          <p className="text-lg font-bold text-red-500">{totalOpen}</p>
        </div>
        <div className="rounded-lg bg-green-500/10 px-3 py-1.5">
          <p className="text-[10px] text-green-600">Resolved</p>
          <p className="text-lg font-bold text-green-600">{totalClosed}</p>
        </div>
        <div className="rounded-lg bg-surface-muted px-3 py-1.5">
          <p className="text-[10px] text-text-muted">Resolution</p>
          <p className="text-lg font-bold text-text-primary">{resolutionRate}%</p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MOCK} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--color-surface-border)', background: 'var(--color-surface)' }}
              itemStyle={{ color: 'var(--color-text-primary)' }}
            />
            <Line type="monotone" dataKey="opened" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} name="Opened" />
            <Line type="monotone" dataKey="closed" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} name="Resolved" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
