import {Clock} from 'lucide-react'
import {FeaturePlaceholder} from '@/components/common/FeaturePlaceholder'

const logs = [
  { key: 'TF-42', title: 'Login page UI',          user: 'AK', date: 'Mar 9',  logged: 3.5, est: 8,  type: 'STORY' },
  { key: 'TF-38', title: 'Fix navbar alignment',   user: 'SL', date: 'Mar 9',  logged: 1.0, est: 2,  type: 'BUG'   },
  { key: 'TF-31', title: 'Design review session',  user: 'JR', date: 'Mar 8',  logged: 2.0, est: 2,  type: 'TASK'  },
  { key: 'TF-24', title: 'Auth integration tests', user: 'AK', date: 'Mar 8',  logged: 4.0, est: 6,  type: 'STORY' },
  { key: 'TF-29', title: 'Deploy to staging',      user: 'MC', date: 'Mar 7',  logged: 1.5, est: 1,  type: 'TASK'  },
]

const TYPE_COLOR: Record<string, string> = {
  STORY: 'bg-primary-subtle text-primary',
  BUG:   'bg-red-50 text-red-500',
  TASK:  'bg-emerald-50 text-emerald-700',
}

const INITIALS_COLOR: Record<string, string> = {
  AK: 'bg-primary', SL: 'bg-emerald-500', JR: 'bg-violet-500', MC: 'bg-accent',
}

function TimeTrackingPreview() {
  const totalLogged = logs.reduce((s, l) => s + l.logged, 0)
  const totalEst    = logs.reduce((s, l) => s + l.est, 0)

  return (
    <div>
      {/* Summary bar */}
      <div className="grid grid-cols-3 divide-x divide-surface-border border-b border-surface-border">
        {[
          { label: 'Logged this week', value: `${totalLogged}h` },
          { label: 'Estimated total',  value: `${totalEst}h`    },
          { label: 'Remaining',        value: `${totalEst - totalLogged}h` },
        ].map(({ label, value }) => (
          <div key={label} className="px-5 py-3">
            <p className="text-xs text-text-muted">{label}</p>
            <p className="text-xl font-bold text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border text-xs font-semibold uppercase tracking-wider text-text-muted">
            <th className="px-4 py-2.5 text-start">Issue</th>
            <th className="px-4 py-2.5 text-start">Assignee</th>
            <th className="px-4 py-2.5 text-start">Date</th>
            <th className="px-4 py-2.5 text-start">Logged</th>
            <th className="px-4 py-2.5 text-start">Progress</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {logs.map((l) => {
            const pct = Math.round((l.logged / l.est) * 100)
            const over = pct > 100
            return (
              <tr key={l.key} className="hover:bg-surface-muted">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[l.type]}`}>{l.type}</span>
                    <span className="font-mono text-xs text-text-muted">{l.key}</span>
                    <span className="text-text-primary">{l.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${INITIALS_COLOR[l.user]}`}>
                    {l.user}
                  </div>
                </td>
                <td className="px-4 py-3 text-text-muted">{l.date}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${over ? 'text-red-500' : 'text-text-primary'}`}>{l.logged}h</span>
                  <span className="text-text-muted"> / {l.est}h</span>
                </td>
                <td className="px-4 py-3 w-40">
                  <div className="flex h-1.5 overflow-hidden rounded-full bg-surface-border">
                    <div
                      className={`h-full rounded-full ${over ? 'bg-red-400' : 'bg-primary'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-text-muted">{pct}%</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function TimeTrackingPage() {
  return (
    <FeaturePlaceholder
      icon={Clock}
      title="Time Tracking"
      description="Log time on issues, track estimates vs actuals, and generate time reports per sprint or member."
      badge="Coming Soon"
      preview={<TimeTrackingPreview />}
    />
  )
}
