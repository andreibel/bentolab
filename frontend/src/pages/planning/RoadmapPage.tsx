import {ChevronDown, GanttChart} from 'lucide-react'
import {FeaturePlaceholder} from '@/components/common/FeaturePlaceholder'

const epics = [
  { key: 'TF-1',  title: 'Authentication System',   start: 0,  width: 25, color: 'bg-primary',      progress: 80 },
  { key: 'TF-8',  title: 'Kanban Board',            start: 10, width: 40, color: 'bg-emerald-500',  progress: 45 },
  { key: 'TF-20', title: 'Sprint Management',       start: 28, width: 30, color: 'bg-accent',       progress: 20 },
  { key: 'TF-31', title: 'Notifications & Inbox',   start: 42, width: 35, color: 'bg-violet-500',   progress: 0  },
  { key: 'TF-44', title: 'Analytics & Reports',     start: 55, width: 35, color: 'bg-red-400',      progress: 0  },
  { key: 'TF-52', title: 'Mobile App',              start: 70, width: 30, color: 'bg-sky-500',      progress: 0  },
]

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']

function RoadmapPreview() {
  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <button className="flex items-center gap-1 rounded-md border border-surface-border px-3 py-1.5 font-medium text-text-secondary hover:bg-surface-muted">
            All boards <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button className="flex items-center gap-1 rounded-md border border-surface-border px-3 py-1.5 font-medium text-text-secondary hover:bg-surface-muted">
            Epics <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex rounded-lg border border-surface-border text-xs font-medium">
          {['Quarter', 'Month', 'Week'].map((v, i) => (
            <button
              key={v}
              className={`px-3 py-1.5 ${i === 0 ? 'bg-primary-subtle text-primary' : 'text-text-secondary hover:bg-surface-muted'} ${i === 0 ? 'rounded-s-md' : i === 2 ? 'rounded-e-md' : ''}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Epic list */}
        <div className="w-52 shrink-0 border-e border-surface-border">
          <div className="border-b border-surface-border px-3 py-2.5 text-xs font-semibold uppercase tracking-widest text-text-muted">
            Epic
          </div>
          {epics.map((epic) => (
            <div key={epic.key} className="flex items-center gap-2 border-b border-surface-border px-3 py-3">
              <span className="shrink-0 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
                {epic.key}
              </span>
              <span className="truncate text-sm text-text-primary">{epic.title}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-x-auto">
          {/* Month headers */}
          <div className="flex border-b border-surface-border">
            {months.map((m) => (
              <div key={m} className="flex-1 border-e border-surface-border py-2.5 text-center text-xs font-semibold text-text-muted last:border-e-0">
                {m}
              </div>
            ))}
          </div>

          {/* Gantt rows */}
          {epics.map((epic) => (
            <div key={epic.key} className="relative flex h-[48px] items-center border-b border-surface-border">
              {/* Grid lines */}
              {months.map((_, i) => (
                <div key={i} className="h-full flex-1 border-e border-surface-border/50 last:border-e-0" />
              ))}
              {/* Bar */}
              <div
                className="absolute flex h-7 items-center overflow-hidden rounded-md"
                style={{ left: `${epic.start}%`, width: `${epic.width}%` }}
              >
                <div className={`h-full w-full rounded-md ${epic.color} opacity-20`} />
                <div
                  className={`absolute h-full rounded-md ${epic.color}`}
                  style={{ width: `${epic.progress}%` }}
                />
                <span className="absolute ps-2 text-[10px] font-semibold text-white drop-shadow">
                  {epic.progress > 0 ? `${epic.progress}%` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function RoadmapPage() {
  return (
    <FeaturePlaceholder
      icon={GanttChart}
      title="Roadmap"
      description="Visualize epics and milestones on a Gantt timeline. See the big picture across all boards."
      badge="Coming Soon"
      preview={<RoadmapPreview />}
    />
  )
}
