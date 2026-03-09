import { Inbox, Bell, AtSign, GitMerge, CheckCircle2 } from 'lucide-react'
import { FeaturePlaceholder, SkeletonLine } from '@/components/common/FeaturePlaceholder'

const mockNotifications = [
  { icon: AtSign,       color: 'bg-primary-subtle text-primary',   title: 'Sara mentioned you in TF-42',           sub: '"@you can you take a look at this?"',     time: '2m ago',  unread: true  },
  { icon: GitMerge,     color: 'bg-emerald-50 text-emerald-600',   title: 'TF-38 was moved to In Review',          sub: 'by Alex on Team Frontend board',          time: '15m ago', unread: true  },
  { icon: Bell,         color: 'bg-accent-subtle text-accent',     title: 'Sprint 3 ends in 2 days',               sub: '3 of 8 issues still open',                time: '1h ago',  unread: true  },
  { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600',   title: 'TF-31 was completed',                   sub: 'Design review — marked Done by Maria',    time: '3h ago',  unread: false },
  { icon: AtSign,       color: 'bg-primary-subtle text-primary',   title: 'You were assigned to TF-45',            sub: 'Implement dark mode toggle',              time: '5h ago',  unread: false },
  { icon: Bell,         color: 'bg-red-50 text-red-500',           title: 'TF-29 is past due',                     sub: 'Deploy to staging — due yesterday',       time: '1d ago',  unread: false },
]

function InboxPreview() {
  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <div className="flex gap-1 text-sm font-medium">
          {['All', 'Mentions', 'Assignments', 'Sprint'].map((tab, i) => (
            <button
              key={tab}
              className={`rounded-md px-3 py-1.5 ${i === 0 ? 'bg-primary-subtle text-primary' : 'text-text-secondary hover:bg-surface-muted'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="text-xs text-text-muted hover:text-primary">Mark all read</button>
      </div>

      {/* Items */}
      <div className="divide-y divide-surface-border">
        {mockNotifications.map((n, i) => (
          <div key={i} className={`flex items-start gap-3 px-4 py-3 hover:bg-surface-muted ${n.unread ? 'bg-primary-subtle/20' : ''}`}>
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n.color}`}>
              <n.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm ${n.unread ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                  {n.title}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-text-muted">{n.time}</span>
                  {n.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
                </div>
              </div>
              <p className="mt-0.5 text-xs text-text-muted truncate">{n.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InboxPage() {
  return (
    <FeaturePlaceholder
      icon={Inbox}
      title="Inbox"
      description="Mentions, assignments, sprint alerts and activity — all in one place."
      badge="Coming Soon"
      preview={<InboxPreview />}
    />
  )
}
