import {BarChart2} from 'lucide-react'
import {FeaturePlaceholder} from '@/components/common/FeaturePlaceholder'

const velocityData = [14, 22, 18, 26, 28, 24, 30]
const burndown     = [30, 26, 24, 20, 16, 12, 8, 5, 3, 0]
const labels       = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7']

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span className="text-[10px] font-medium text-text-muted">{value}</span>
      <div className="flex w-full justify-center">
        <div
          className={`w-8 rounded-t-sm ${color}`}
          style={{ height: `${(value / max) * 80}px` }}
        />
      </div>
    </div>
  )
}

function ReportsPreview() {
  const maxV = Math.max(...velocityData)

  return (
    <div>
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <div className="flex gap-1 text-sm font-medium">
          {['Velocity', 'Burndown', 'Cycle Time', 'Flow'].map((tab, i) => (
            <button
              key={tab}
              className={`rounded-md px-3 py-1.5 ${i === 0 ? 'bg-primary-subtle text-primary' : 'text-text-secondary hover:bg-surface-muted'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <span className="text-xs text-text-muted">Last 7 sprints</span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-surface-border">
        {/* Velocity chart */}
        <div className="p-5">
          <p className="mb-1 text-sm font-semibold text-text-primary">Sprint Velocity</p>
          <p className="mb-4 text-xs text-text-muted">Story points completed per sprint</p>
          <div className="flex h-24 items-end gap-1 border-b border-surface-border">
            {velocityData.map((v, i) => (
              <Bar key={i} value={v} max={maxV} color="bg-primary" />
            ))}
          </div>
          <div className="mt-1 flex justify-between px-2">
            {labels.map((l) => <span key={l} className="text-[10px] text-text-muted">{l}</span>)}
          </div>
          <div className="mt-4 flex gap-6 text-xs">
            <div><p className="text-text-muted">Average</p><p className="text-lg font-bold text-text-primary">23 pts</p></div>
            <div><p className="text-text-muted">Trend</p><p className="text-lg font-bold text-emerald-500">↑ 12%</p></div>
          </div>
        </div>

        {/* Burndown */}
        <div className="p-5">
          <p className="mb-1 text-sm font-semibold text-text-primary">Burndown — Sprint 3</p>
          <p className="mb-4 text-xs text-text-muted">Remaining story points per day</p>
          <div className="relative h-24 border-b border-s border-surface-border">
            <svg viewBox="0 0 200 80" className="h-full w-full" preserveAspectRatio="none">
              {/* Ideal line */}
              <line x1="0" y1="0" x2="200" y2="80" stroke="#E4E4E7" strokeWidth="1.5" strokeDasharray="4 3" />
              {/* Actual */}
              <polyline
                points={burndown.map((v, i) => `${(i / (burndown.length - 1)) * 200},${(v / 30) * 80}`).join(' ')}
                fill="none"
                stroke="#5B47E0"
                strokeWidth="2"
              />
              <polyline
                points={burndown.map((v, i) => `${(i / (burndown.length - 1)) * 200},${(v / 30) * 80}`).join(' ')}
                fill="#5B47E020"
                stroke="none"
              />
            </svg>
          </div>
          <div className="mt-4 flex gap-6 text-xs">
            <div><p className="text-text-muted">Remaining</p><p className="text-lg font-bold text-text-primary">3 pts</p></div>
            <div><p className="text-text-muted">On track</p><p className="text-lg font-bold text-emerald-500">Yes ✓</p></div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 divide-x divide-surface-border border-t border-surface-border">
        {[
          { label: 'Avg cycle time',  value: '3.2 days', trend: '↓ 0.5d', good: true  },
          { label: 'Completion rate', value: '87%',      trend: '↑ 5%',  good: true  },
          { label: 'Scope creep',     value: '2 issues', trend: '↑ 1',   good: false },
          { label: 'Bug rate',        value: '12%',      trend: '↓ 3%',  good: true  },
        ].map(({ label, value, trend, good }) => (
          <div key={label} className="px-4 py-3">
            <p className="text-xs text-text-muted">{label}</p>
            <p className="mt-1 text-lg font-bold text-text-primary">{value}</p>
            <p className={`text-xs font-medium ${good ? 'text-emerald-500' : 'text-red-500'}`}>{trend}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <FeaturePlaceholder
      icon={BarChart2}
      title="Reports"
      description="Velocity charts, burndown, cycle time, and flow diagrams. Data-driven sprint retrospectives."
      badge="Coming Soon"
      preview={<ReportsPreview />}
    />
  )
}
