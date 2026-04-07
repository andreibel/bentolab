import {Cable} from 'lucide-react'
import {FeaturePlaceholder} from '@/components/common/FeaturePlaceholder'

// ── Integration definitions ────────────────────────────────────────────────────

interface Integration {
  name: string
  description: string
  category: 'Code' | 'Communication' | 'CI/CD' | 'Monitoring'
  status: 'coming_soon' | 'planned'
  icon: string       // emoji / logo placeholder
  color: string      // accent bg class
}

const INTEGRATIONS: Integration[] = [
  // Code hosting
  { name: 'GitHub',          description: 'Link PRs, commits, and branches to issues. Auto-close issues on merge.',        category: 'Code',          status: 'coming_soon', icon: '🐙', color: 'bg-neutral-100 dark:bg-neutral-800'   },
  { name: 'GitLab',          description: 'Connect merge requests and pipelines directly to your board.',                  category: 'Code',          status: 'coming_soon', icon: '🦊', color: 'bg-orange-50 dark:bg-orange-900/20'   },
  { name: 'Bitbucket',       description: 'Sync pull requests and repository events with your workspace.',                 category: 'Code',          status: 'planned',     icon: '🪣', color: 'bg-blue-50 dark:bg-blue-900/20'       },
  // Communication
  { name: 'Slack',           description: 'Post issue updates, sprint alerts, and mentions to your Slack channels.',       category: 'Communication', status: 'coming_soon', icon: '💬', color: 'bg-yellow-50 dark:bg-yellow-900/20'   },
  { name: 'Discord',         description: 'Send real-time board activity to Discord channels via webhooks.',               category: 'Communication', status: 'coming_soon', icon: '🎮', color: 'bg-indigo-50 dark:bg-indigo-900/20'   },
  { name: 'Microsoft Teams', description: 'Get sprint and issue notifications directly in your Teams workspace.',          category: 'Communication', status: 'planned',     icon: '🟣', color: 'bg-violet-50 dark:bg-violet-900/20'   },
  // CI/CD
  { name: 'GitHub Actions',  description: 'Trigger workflows from board events and surface run status on issues.',         category: 'CI/CD',         status: 'planned',     icon: '⚙️', color: 'bg-neutral-100 dark:bg-neutral-800'   },
  { name: 'Jenkins',         description: 'Connect build pipelines and display job status on linked issues.',              category: 'CI/CD',         status: 'planned',     icon: '🏗️', color: 'bg-red-50 dark:bg-red-900/20'         },
  // Monitoring
  { name: 'Sentry',          description: 'Automatically create issues from Sentry errors and link stack traces.',         category: 'Monitoring',    status: 'planned',     icon: '🔍', color: 'bg-purple-50 dark:bg-purple-900/20'   },
  { name: 'PagerDuty',       description: 'Escalate critical incidents as high-priority issues on the right board.',       category: 'Monitoring',    status: 'planned',     icon: '🚨', color: 'bg-emerald-50 dark:bg-emerald-900/20' },
]

const CATEGORY_ORDER: Integration['category'][] = ['Code', 'Communication', 'CI/CD', 'Monitoring']

// ── Preview component ─────────────────────────────────────────────────────────

function IntegrationsPreview() {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: INTEGRATIONS.filter((i) => i.category === cat),
  }))

  return (
    <div className="divide-y divide-surface-border">
      {grouped.map(({ cat, items }) => (
        <div key={cat}>
          {/* Category header */}
          <div className="border-b border-surface-border bg-surface-muted px-5 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {cat}
            </span>
          </div>

          {/* Integration rows */}
          <div className="divide-y divide-surface-border">
            {items.map((integration) => (
              <div
                key={integration.name}
                className="flex items-center gap-4 px-5 py-4"
              >
                {/* Icon */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${integration.color}`}>
                  {integration.icon}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">{integration.name}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{integration.description}</p>
                </div>

                {/* Badge */}
                <span
                  className={
                    integration.status === 'coming_soon'
                      ? 'shrink-0 rounded-full bg-primary-subtle px-2.5 py-0.5 text-xs font-semibold text-primary'
                      : 'shrink-0 rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-text-muted'
                  }
                >
                  {integration.status === 'coming_soon' ? 'Coming Soon' : 'Planned'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  return (
    <FeaturePlaceholder
      icon={Cable}
      title="Integrations"
      description="Connect Bento with your existing tools — code hosts, chat apps, CI/CD pipelines, and monitoring."
      badge="Coming Soon"
      preview={<IntegrationsPreview />}
    />
  )
}
