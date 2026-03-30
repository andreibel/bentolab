import {Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts'

const MOCK = [
  { date: 'Mar 1',  open: 32, closed: 4  },
  { date: 'Mar 5',  open: 35, closed: 9  },
  { date: 'Mar 8',  open: 30, closed: 14 },
  { date: 'Mar 11', open: 28, closed: 20 },
  { date: 'Mar 13', open: 24, closed: 28 },
]

export function OpenClosedWidget({ boardId: _ }: { boardId: string }) {
  return (
    <div className="flex h-full flex-col">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={MOCK} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradOpen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradClosed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--color-surface-border)', background: 'var(--color-surface)' }}
            itemStyle={{ color: 'var(--color-text-primary)' }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Area type="monotone" dataKey="open"   stroke="#EF4444" fill="url(#gradOpen)"   strokeWidth={2} dot={false} name="Open"   />
          <Area type="monotone" dataKey="closed" stroke="#22C55E" fill="url(#gradClosed)" strokeWidth={2} dot={false} name="Closed" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
