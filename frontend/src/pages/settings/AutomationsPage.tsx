import { Zap } from 'lucide-react'
import { FeaturePlaceholder } from '@/components/common/FeaturePlaceholder'

const rules = [
  { trigger: 'Issue moved to "Done"',         action: 'Send Slack notification to #dev',    active: true,  runs: 42 },
  { trigger: 'Issue assigned to me',           action: 'Add to my "Sprint" label',           active: true,  runs: 18 },
  { trigger: 'Issue priority set to CRITICAL', action: 'Notify all board members by email',  active: false, runs: 3  },
  { trigger: 'Sprint completed',               action: 'Create retrospective issue on board', active: true,  runs: 6  },
  { trigger: 'Issue unassigned for 3 days',    action: 'Send reminder to product owner',     active: false, runs: 0  },
]

function AutomationsPreview() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <p className="text-sm font-semibold text-text-primary">
          {rules.filter((r) => r.active).length} active rules
        </p>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-light">
          <Zap className="h-3.5 w-3.5" />
          New rule
        </button>
      </div>
      <div className="divide-y divide-surface-border">
        {rules.map((r, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded bg-primary-subtle px-2 py-0.5 text-xs font-medium text-primary">When</span>
                <span className="text-text-primary">{r.trigger}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-sm">
                <span className="rounded bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-secondary">Then</span>
                <span className="text-text-secondary">{r.action}</span>
              </div>
            </div>
            <span className="text-xs text-text-muted">{r.runs} runs</span>
            <div className={`relative h-5 w-9 cursor-pointer rounded-full transition-colors ${r.active ? 'bg-primary' : 'bg-surface-border'}`}>
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${r.active ? 'start-4' : 'start-0.5'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AutomationsPage() {
  return (
    <FeaturePlaceholder
      icon={Zap}
      title="Automations"
      description='Build If/Then rules to automate repetitive actions — no code needed. "When issue moves to Done → notify Slack."'
      badge="Coming Soon"
      preview={<AutomationsPreview />}
    />
  )
}
