import {useCallback, useState} from 'react'
import {useParams} from 'react-router-dom'
import GridLayout, {type Layout} from 'react-grid-layout'
import {useResizeObserver} from '@/hooks/useResizeObserver'
import {GripHorizontal, LayoutGrid, Plus, RefreshCw, Settings2, X,} from 'lucide-react'
import {cn} from '@/utils/cn'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

import {SprintHealthWidget} from '@/components/summary/SprintHealthWidget'
import {IssueBreakdownWidget} from '@/components/summary/IssueBreakdownWidget'
import {WorkloadWidget} from '@/components/summary/WorkloadWidget'
import {EpicProgressWidget} from '@/components/summary/EpicProgressWidget'
import {RecentActivityWidget} from '@/components/summary/RecentActivityWidget'
import {OverdueWidget} from '@/components/summary/OverdueWidget'
import {OpenClosedWidget} from '@/components/summary/OpenClosedWidget'
import {UnassignedWidget} from '@/components/summary/UnassignedWidget'
import {VelocityWidget} from '@/components/summary/VelocityWidget'
import {CycleTimeWidget} from '@/components/summary/CycleTimeWidget'
import {WipWidget} from '@/components/summary/WipWidget'
import {PriorityBreakdownWidget} from '@/components/summary/PriorityBreakdownWidget'
import {StaleIssuesWidget} from '@/components/summary/StaleIssuesWidget'
import {BugRateWidget} from '@/components/summary/BugRateWidget'
import {TeamActivityWidget} from '@/components/summary/TeamActivityWidget'

// ── Widget registry ───────────────────────────────────────────────────────────

export type WidgetType =
  | 'SPRINT_HEALTH'
  | 'ISSUE_BREAKDOWN'
  | 'WORKLOAD'
  | 'EPIC_PROGRESS'
  | 'RECENT_ACTIVITY'
  | 'OVERDUE'
  | 'OPEN_CLOSED'
  | 'UNASSIGNED'
  | 'VELOCITY'
  | 'CYCLE_TIME'
  | 'WIP'
  | 'PRIORITY_BREAKDOWN'
  | 'STALE_ISSUES'
  | 'BUG_RATE'
  | 'TEAM_ACTIVITY'

interface WidgetMeta {
  label:       string
  description: string
  minW:        number
  minH:        number
  defaultW:    number
  defaultH:    number
  icon:        string
}

export const WIDGET_REGISTRY: Record<WidgetType, WidgetMeta> = {
  SPRINT_HEALTH:     { label: 'Sprint Health',       description: 'Current sprint progress and burndown',          minW: 3, minH: 3, defaultW: 12, defaultH: 6, icon: '🏃' },
  ISSUE_BREAKDOWN:   { label: 'Issue Breakdown',      description: 'Issues by type (Story, Task, Bug, Subtask)',    minW: 3, minH: 3, defaultW: 10, defaultH: 6, icon: '📊' },
  WORKLOAD:          { label: 'Team Workload',         description: 'Open issues per team member',                  minW: 3, minH: 3, defaultW: 10, defaultH: 6, icon: '👥' },
  EPIC_PROGRESS:     { label: 'Epic Progress',         description: 'Completion percentage for each epic',          minW: 3, minH: 3, defaultW: 12, defaultH: 6, icon: '🗺️' },
  RECENT_ACTIVITY:   { label: 'Recent Activity',       description: 'Latest issue events and comments',             minW: 3, minH: 3, defaultW: 8,  defaultH: 7, icon: '⚡' },
  OVERDUE:           { label: 'Overdue Issues',         description: 'Issues past their due date',                  minW: 3, minH: 3, defaultW: 10, defaultH: 6, icon: '🔴' },
  OPEN_CLOSED:       { label: 'Open vs Closed',         description: 'Issue trend over the past 30 days',           minW: 4, minH: 3, defaultW: 14, defaultH: 6, icon: '📈' },
  UNASSIGNED:        { label: 'Unassigned Issues',      description: 'Issues with no assignee',                     minW: 3, minH: 3, defaultW: 8,  defaultH: 6, icon: '❓' },
  VELOCITY:          { label: 'Velocity',               description: 'Story points completed per sprint',           minW: 3, minH: 3, defaultW: 12, defaultH: 6, icon: '⚡' },
  CYCLE_TIME:        { label: 'Cycle Time',             description: 'Average time issues spend per column',        minW: 3, minH: 3, defaultW: 12, defaultH: 6, icon: '⏱️' },
  WIP:               { label: 'WIP Status',             description: 'Work-in-progress limits per column',          minW: 3, minH: 3, defaultW: 8,  defaultH: 6, icon: '🚦' },
  PRIORITY_BREAKDOWN:{ label: 'Priority Breakdown',     description: 'Issues by priority level',                    minW: 3, minH: 3, defaultW: 10, defaultH: 6, icon: '🎯' },
  STALE_ISSUES:      { label: 'Stale Issues',           description: 'Issues with no updates in 7+ days',          minW: 3, minH: 3, defaultW: 10, defaultH: 6, icon: '🧊' },
  BUG_RATE:          { label: 'Bug Rate',               description: 'Bug count trend and resolution rate',         minW: 3, minH: 3, defaultW: 12, defaultH: 6, icon: '🐛' },
  TEAM_ACTIVITY:     { label: 'Team Activity',          description: 'Contributions per team member this week',     minW: 3, minH: 3, defaultW: 10, defaultH: 6, icon: '🔥' },
}

const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType<{ boardId: string }>> = {
  SPRINT_HEALTH:      SprintHealthWidget,
  ISSUE_BREAKDOWN:    IssueBreakdownWidget,
  WORKLOAD:           WorkloadWidget,
  EPIC_PROGRESS:      EpicProgressWidget,
  RECENT_ACTIVITY:    RecentActivityWidget,
  OVERDUE:            OverdueWidget,
  OPEN_CLOSED:        OpenClosedWidget,
  UNASSIGNED:         UnassignedWidget,
  VELOCITY:           VelocityWidget,
  CYCLE_TIME:         CycleTimeWidget,
  WIP:                WipWidget,
  PRIORITY_BREAKDOWN: PriorityBreakdownWidget,
  STALE_ISSUES:       StaleIssuesWidget,
  BUG_RATE:           BugRateWidget,
  TEAM_ACTIVITY:      TeamActivityWidget,
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardWidget {
  id:   string
  type: WidgetType
}

interface StoredLayout {
  widgets: DashboardWidget[]
  layout:  Layout[]
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'w-sprint',    type: 'SPRINT_HEALTH'    },
  { id: 'w-breakdown', type: 'ISSUE_BREAKDOWN'  },
  { id: 'w-workload',  type: 'WORKLOAD'         },
]

const DEFAULT_LAYOUT: Layout[] = [
  { i: 'w-sprint',    x: 0,  y: 0, w: 14, h: 6, minW: 3, minH: 3 },
  { i: 'w-breakdown', x: 14, y: 0, w: 10, h: 6, minW: 3, minH: 3 },
  { i: 'w-workload',  x: 0,  y: 6, w: 12, h: 6, minW: 3, minH: 3 },
]

const COLS = 24
const ROW_HEIGHT = 36

// ── Storage helpers ───────────────────────────────────────────────────────────

const LAYOUT_VERSION = 'v2' // bump when grid config changes to discard stale layouts

function loadLayout(boardId: string): StoredLayout | null {
  try {
    const raw = localStorage.getItem(`bento-dashboard-${LAYOUT_VERSION}-${boardId}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveLayout(boardId: string, data: StoredLayout) {
  localStorage.setItem(`bento-dashboard-${LAYOUT_VERSION}-${boardId}`, JSON.stringify(data))
}

// ── Widget shell ──────────────────────────────────────────────────────────────

function WidgetShell({
  widget,
  editMode,
  onRemove,
  children,
}: {
  widget:   DashboardWidget
  editMode: boolean
  onRemove: (id: string) => void
  children: React.ReactNode
}) {
  const meta = WIDGET_REGISTRY[widget.type]
  return (
    <div className={cn(
      'flex h-full flex-col rounded-xl border bg-surface transition-all',
      editMode
        ? 'border-primary/40 shadow-md'
        : 'border-surface-border shadow-sm',
    )}>
      {/* Widget header */}
      <div className={cn(
        'flex shrink-0 items-center gap-2 border-b border-surface-border px-4 py-2.5',
        editMode && 'cursor-grab active:cursor-grabbing',
      )}>
        <span className="text-base leading-none">{meta.icon}</span>
        <span className="flex-1 truncate text-sm font-semibold text-text-primary">{meta.label}</span>
        {editMode && (
          <>
            <GripHorizontal className="h-4 w-4 shrink-0 text-text-muted" />
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => onRemove(widget.id)}
              className="shrink-0 rounded p-0.5 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
      {/* Widget body */}
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {children}
      </div>
    </div>
  )
}

// ── Add widget panel ──────────────────────────────────────────────────────────

function AddWidgetPanel({
  presentTypes,
  onAdd,
  onClose,
}: {
  presentTypes: Set<WidgetType>
  onAdd:        (type: WidgetType) => void
  onClose:      () => void
}) {
  const [search, setSearch] = useState('')
  const entries = (Object.entries(WIDGET_REGISTRY) as [WidgetType, WidgetMeta][])
    .filter(([, m]) => m.label.toLowerCase().includes(search.toLowerCase()) ||
                       m.description.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 flex h-[560px] w-[680px] flex-col rounded-2xl border border-surface-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-surface-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Add widget</h2>
            <p className="text-xs text-text-muted">{Object.keys(WIDGET_REGISTRY).length} widgets available</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 border-b border-surface-border px-5 py-3">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search widgets…"
            className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            {entries.map(([type, meta]) => {
              const added = presentTypes.has(type)
              return (
                <button
                  key={type}
                  onClick={() => { if (!added) { onAdd(type); onClose() } }}
                  disabled={added}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-4 text-start transition-all',
                    added
                      ? 'cursor-not-allowed border-surface-border bg-surface-muted opacity-50'
                      : 'border-surface-border hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm',
                  )}
                >
                  <span className="mt-0.5 text-2xl leading-none">{meta.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-text-primary">{meta.label}</p>
                      {added && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          Added
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-snug text-text-muted">{meta.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SummaryPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const bid = boardId!

  const stored = loadLayout(bid)

  const [widgets,   setWidgets]   = useState<DashboardWidget[]>(stored?.widgets ?? DEFAULT_WIDGETS)
  const [layout,    setLayout]    = useState<Layout[]>(stored?.layout ?? DEFAULT_LAYOUT)
  const [editMode,  setEditMode]  = useState(false)
  const [addOpen,   setAddOpen]   = useState(false)

  const [containerRef, containerWidth] = useResizeObserver<HTMLDivElement>()

  // Sync layout changes (drag/resize)
  const handleLayoutChange = useCallback((next: Layout[]) => {
    setLayout(next)
    saveLayout(bid, { widgets, layout: next })
  }, [bid, widgets])

  const addWidget = useCallback((type: WidgetType) => {
    const meta = WIDGET_REGISTRY[type]
    const id = `w-${type.toLowerCase()}-${Date.now()}`

    // Place below existing content
    const maxY = layout.reduce((m, l) => Math.max(m, l.y + l.h), 0)
    const newItem: Layout = {
      i: id, x: 0, y: maxY,
      w: meta.defaultW, h: meta.defaultH,
      minW: meta.minW, minH: meta.minH,
    }

    const nextWidgets = [...widgets, { id, type }]
    const nextLayout  = [...layout, newItem]
    setWidgets(nextWidgets)
    setLayout(nextLayout)
    saveLayout(bid, { widgets: nextWidgets, layout: nextLayout })
  }, [bid, widgets, layout])

  const removeWidget = useCallback((id: string) => {
    const nextWidgets = widgets.filter((w) => w.id !== id)
    const nextLayout  = layout.filter((l) => l.i !== id)
    setWidgets(nextWidgets)
    setLayout(nextLayout)
    saveLayout(bid, { widgets: nextWidgets, layout: nextLayout })
  }, [bid, widgets, layout])

  const resetLayout = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS)
    setLayout(DEFAULT_LAYOUT)
    localStorage.removeItem(`bento-dashboard-${bid}`)
  }, [bid])

  const presentTypes = new Set(widgets.map((w) => w.type))
  const colWidth = containerWidth > 0 ? containerWidth : 800

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-surface-border bg-surface px-5 py-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-text-muted" />
          <h1 className="text-sm font-semibold text-text-primary">Summary</h1>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
            {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {editMode && (
            <>
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Add widget
              </button>
              <button
                onClick={resetLayout}
                className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </button>
            </>
          )}
          <button
            onClick={() => setEditMode((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
              editMode
                ? 'border-primary/40 bg-primary text-white hover:bg-primary-light'
                : 'border-surface-border text-text-muted hover:border-primary/30 hover:text-text-primary',
            )}
          >
            <Settings2 className="h-3.5 w-3.5" />
            {editMode ? 'Done' : 'Customize'}
          </button>
        </div>
      </div>

      {/* Edit mode banner */}
      {editMode && (
        <div className="shrink-0 border-b border-primary/20 bg-primary/5 px-5 py-2 text-xs text-primary">
          Drag to reorder · Resize from the corner · Click × to remove · Click <strong>Done</strong> when finished
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div ref={containerRef} className={cn('px-5 pt-4 pb-8', editMode && 'bento-grid-edit')}>
          {colWidth > 0 && (
            <GridLayout
              layout={layout}
              cols={COLS}
              rowHeight={ROW_HEIGHT}
              width={colWidth}
              isDraggable={editMode}
              isResizable={editMode}
              draggableHandle=".drag-handle"
              onLayoutChange={handleLayoutChange}
              margin={[12, 12]}
              containerPadding={[0, 0]}
              resizeHandles={['se']}
            >
              {widgets.map((widget) => {
                const Component = WIDGET_COMPONENTS[widget.type]
                return (
                  <div key={widget.id} className="drag-handle">
                    <WidgetShell
                      widget={widget}
                      editMode={editMode}
                      onRemove={removeWidget}
                    >
                      <Component boardId={bid} />
                    </WidgetShell>
                  </div>
                )
              })}
            </GridLayout>
          )}

          {widgets.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-surface-border text-3xl">
                📊
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">No widgets yet</p>
                <p className="mt-1 text-xs text-text-muted">Click Customize then Add widget to get started</p>
              </div>
              <button
                onClick={() => { setEditMode(true); setAddOpen(true) }}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-light"
              >
                <Plus className="h-3.5 w-3.5" />
                Add widget
              </button>
            </div>
          )}
        </div>
      </div>

      {addOpen && (
        <AddWidgetPanel
          presentTypes={presentTypes}
          onAdd={addWidget}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  )
}
