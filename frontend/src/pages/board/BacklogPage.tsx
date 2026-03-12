import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus, ChevronDown, ChevronRight, Play,
  Loader2, X,
} from 'lucide-react'
import { IssueTypeIcon, PriorityIcon, EpicTag } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useIssues, issuesApi } from '@/api/issues'
import { useSprints, sprintsApi } from '@/api/sprints'
import { useEpics, epicsApi } from '@/api/epics'
import { useBoard } from '@/api/boards'
import { queryKeys } from '@/api/queryKeys'
import { IssueDetailPanel } from '@/components/issues/IssueDetailPanel'
import { CreateIssueModal } from '@/components/issues/CreateIssueModal'
import { cn } from '@/utils/cn'
import type { Issue } from '@/types/issue'
import type { Sprint } from '@/types/sprint'
import type { Epic } from '@/types/epic'

const EPIC_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899']

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return `from ${fmt(start)}`
  return `until ${fmt(end!)}`
}

// ── Sprint move dropdown ───────────────────────────────────────────────────────

function SprintMoveMenu({
  issue,
  sprints,
  onMove,
}: {
  issue: Issue
  sprints: Sprint[]
  onMove: (sprintId: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const eligible = sprints.filter((s) => s.status !== 'COMPLETED' && s.id !== issue.sprintId)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-text-muted transition-colors hover:bg-surface-border hover:text-text-primary"
      >
        {issue.sprintId ? 'Move' : '+ Sprint'}
      </button>
      {open && (
        <div className="absolute start-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-surface-border bg-surface shadow-xl">
          {issue.sprintId && (
            <button
              onClick={(e) => { e.stopPropagation(); onMove(null); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-muted hover:bg-surface-muted"
            >
              → Backlog
            </button>
          )}
          {eligible.map((s) => (
            <button
              key={s.id}
              onClick={(e) => { e.stopPropagation(); onMove(s.id); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-surface-muted"
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 shrink-0 rounded-full',
                  s.status === 'ACTIVE' ? 'bg-green-500' : 'bg-surface-border',
                )}
              />
              {s.name}
            </button>
          ))}
          {eligible.length === 0 && !issue.sprintId && (
            <div className="px-3 py-2 text-xs text-text-muted">No active sprints</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Issue row ─────────────────────────────────────────────────────────────────

function IssueRow({
  issue,
  epicsMap,
  sprints,
  onOpen,
  onMove,
}: {
  issue: Issue
  epicsMap: Map<string, Epic>
  sprints: Sprint[]
  onOpen: (id: string) => void
  onMove: (issueId: string, sprintId: string | null) => void
}) {
  const epic = issue.epicId ? epicsMap.get(issue.epicId) : undefined

  return (
    <div
      onClick={() => onOpen(issue.id)}
      className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-muted/60"
    >
      <div className="shrink-0"><IssueTypeIcon type={issue.type} /></div>
      <span className="w-16 shrink-0 font-mono text-[11px] text-text-muted">{issue.issueKey}</span>
      <span className="flex-1 truncate text-sm text-text-primary">{issue.title}</span>

      {epic && <EpicTag title={epic.title} color={epic.color} />}

      <div className="shrink-0"><PriorityIcon priority={issue.priority} /></div>

      {issue.storyPoints != null && (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-surface-muted text-[10px] font-semibold text-text-secondary">
          {issue.storyPoints}
        </span>
      )}

      <Avatar userId={issue.assigneeId} size="sm" className="shrink-0" />

      <div
        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <SprintMoveMenu issue={issue} sprints={sprints} onMove={(sid) => onMove(issue.id, sid)} />
      </div>
    </div>
  )
}

// ── Sprint section ─────────────────────────────────────────────────────────────

function SprintSection({
  sprint,
  issues,
  epicsMap,
  allSprints,
  onOpen,
  onMove,
  onStart,
  onComplete,
  onAddIssue,
}: {
  sprint: Sprint
  issues: Issue[]
  epicsMap: Map<string, Epic>
  allSprints: Sprint[]
  onOpen: (id: string) => void
  onMove: (issueId: string, sprintId: string | null) => void
  onStart: (sprintId: string) => void
  onComplete: (sprintId: string) => void
  onAddIssue: (sprintId: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const totalPts = issues.reduce((s, i) => s + (i.storyPoints ?? 0), 0)
  const doneCount = issues.filter((i) => i.completedAt).length
  const progress = issues.length > 0 ? Math.round((doneCount / issues.length) * 100) : 0
  const dateRange = fmtDateRange(sprint.startDate, sprint.endDate)

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-surface-muted/40">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="shrink-0 text-text-muted hover:text-text-primary"
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronDown  className="h-4 w-4" />
          }
        </button>

        {sprint.status === 'ACTIVE' && (
          <Play className="h-3.5 w-3.5 shrink-0 text-green-500" />
        )}

        <span className="truncate text-sm font-semibold text-text-primary">{sprint.name}</span>

        {sprint.status === 'ACTIVE' && (
          <span className="shrink-0 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-green-600">
            Active
          </span>
        )}
        {sprint.status === 'PLANNED' && (
          <span className="shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
            Planned
          </span>
        )}

        {dateRange && (
          <span className="shrink-0 text-xs text-text-muted">{dateRange}</span>
        )}

        <span className="shrink-0 text-xs text-text-muted">
          {issues.length} issue{issues.length !== 1 ? 's' : ''}
          {totalPts > 0 && ` · ${totalPts} pts`}
        </span>

        {sprint.status === 'ACTIVE' && issues.length > 0 && (
          <div className="flex shrink-0 items-center gap-1.5">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-border">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] text-text-muted">{progress}%</span>
          </div>
        )}

        <div className="ms-auto flex shrink-0 items-center gap-1">
          {sprint.status === 'PLANNED' && (
            <button
              onClick={(e) => { e.stopPropagation(); onStart(sprint.id) }}
              className="rounded-md border border-surface-border px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-primary/30 hover:text-primary"
            >
              Start Sprint
            </button>
          )}
          {sprint.status === 'ACTIVE' && (
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(sprint.id) }}
              className="rounded-md border border-surface-border px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-green-500/30 hover:text-green-600"
            >
              Complete
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="ms-4 border-s border-surface-border/50 ps-3">
          {issues.map((issue) => (
            <IssueRow
              key={issue.id}
              issue={issue}
              epicsMap={epicsMap}
              sprints={allSprints}
              onOpen={onOpen}
              onMove={onMove}
            />
          ))}
          <button
            onClick={() => onAddIssue(sprint.id)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-text-muted transition-colors hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            Add issue
          </button>
        </div>
      )}
    </div>
  )
}

// ── Backlog section ────────────────────────────────────────────────────────────

function BacklogSection({
  issues,
  totalCount,
  epicsMap,
  sprints,
  onOpen,
  onMove,
  onAddIssue,
  onCreateSprint,
}: {
  issues: Issue[]
  totalCount: number
  epicsMap: Map<string, Epic>
  sprints: Sprint[]
  onOpen: (id: string) => void
  onMove: (issueId: string, sprintId: string | null) => void
  onAddIssue: () => void
  onCreateSprint: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-surface-muted/40">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="shrink-0 text-text-muted hover:text-text-primary"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <span className="flex-1 text-sm font-semibold text-text-primary">Backlog</span>
        <span className="text-xs text-text-muted">{totalCount} issue{totalCount !== 1 ? 's' : ''}</span>
        <button
          onClick={onCreateSprint}
          className="flex items-center gap-1 rounded-md border border-surface-border px-2 py-1 text-xs text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
        >
          <Plus className="h-3 w-3" />
          Sprint
        </button>
      </div>

      {!collapsed && (
        <div className="ms-4 border-s border-surface-border/50 ps-3">
          {issues.length === 0 && (
            <p className="py-6 text-center text-xs text-text-muted">No issues in backlog</p>
          )}
          {issues.map((issue) => (
            <IssueRow
              key={issue.id}
              issue={issue}
              epicsMap={epicsMap}
              sprints={sprints}
              onOpen={onOpen}
              onMove={onMove}
            />
          ))}
          <button
            onClick={onAddIssue}
            className="flex items-center gap-2 px-3 py-2 text-xs text-text-muted transition-colors hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            Add issue
          </button>
        </div>
      )}
    </div>
  )
}

// ── Create Sprint Modal ────────────────────────────────────────────────────────

function CreateSprintModal({ boardId, onClose }: { boardId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName]           = useState('')
  const [goal, setGoal]           = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const today    = new Date().toISOString().split('T')[0]
    const twoWeeks = new Date(Date.now() + 14 * 86_400_000).toISOString().split('T')[0]
    setStartDate(today)
    setEndDate(twoWeeks)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !startDate || !endDate) return
    setSubmitting(true)
    try {
      await sprintsApi.create({
        boardId,
        name:      name.trim(),
        goal:      goal.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate:   new Date(endDate).toISOString(),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all(boardId) })
      toast.success('Sprint created')
      onClose()
    } catch {
      toast.error('Failed to create sprint')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-[440px] rounded-2xl border border-surface-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <h2 className="text-base font-semibold text-text-primary">Create Sprint</h2>
          <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-surface-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sprint 1"
              required autoFocus
              className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Start Date *</label>
              <input
                type="date" value={startDate}
                onChange={(e) => setStartDate(e.target.value)} required
                className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">End Date *</label>
              <input
                type="date" value={endDate}
                onChange={(e) => setEndDate(e.target.value)} required
                className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Sprint Goal</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What do you want to achieve in this sprint?"
              rows={2}
              className="w-full resize-none rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-text-muted hover:text-text-primary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create Sprint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Create Epic Modal ─────────────────────────────────────────────────────────

function CreateEpicModal({ boardId, onClose }: { boardId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle]       = useState('')
  const [color, setColor]       = useState(EPIC_COLORS[5])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await epicsApi.create({ boardId, title: title.trim(), color })
      queryClient.invalidateQueries({ queryKey: queryKeys.epics.list(boardId) })
      toast.success('Epic created')
      onClose()
    } catch {
      toast.error('Failed to create epic')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-[400px] rounded-2xl border border-surface-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <h2 className="text-base font-semibold text-text-primary">Create Epic</h2>
          <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-surface-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Name *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Authentication, Dashboard redesign…"
              required autoFocus
              className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-text-muted">Color</label>
            <div className="flex gap-2">
              {EPIC_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? `0 0 0 2px var(--color-surface), 0 0 0 4px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-text-muted hover:text-text-primary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: color }}
            >
              {submitting ? 'Creating…' : 'Create Epic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Complete Sprint Modal ──────────────────────────────────────────────────────

function CompleteSprintModal({
  sprint,
  otherSprints,
  onConfirm,
  onClose,
}: {
  sprint: Sprint
  otherSprints: Sprint[]
  onConfirm: (moveToSprintId: string | null) => void
  onClose: () => void
}) {
  const [moveToId, setMoveToId] = useState('')
  const eligible = otherSprints.filter((s) => s.status !== 'COMPLETED')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-[420px] rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
        <h2 className="mb-1 text-base font-semibold text-text-primary">Complete "{sprint.name}"</h2>
        <p className="mb-4 text-sm text-text-secondary">
          Where should incomplete issues go after this sprint ends?
        </p>
        <select
          value={moveToId}
          onChange={(e) => setMoveToId(e.target.value)}
          className="mb-5 w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
        >
          <option value="">Move to Backlog</option>
          {eligible.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-text-muted hover:text-text-primary">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(moveToId || null)}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Complete Sprint
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BacklogPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const queryClient = useQueryClient()

  const { data: board }                           = useBoard(boardId!)
  const { data: issuesPage, isLoading: issLoading } = useIssues(boardId!)
  const { data: sprints = [], isLoading: spLoading } = useSprints(boardId!)
  const { data: epics   = [] }                    = useEpics(boardId!)

  const allIssues = issuesPage?.content ?? []
  const epicsMap  = useMemo(() => new Map(epics.map((e) => [e.id, e])), [epics])

  const [selectedEpicId,  setSelectedEpicId]  = useState<string | null>(null)
  const [detailIssueId,   setDetailIssueId]   = useState<string | null>(null)
  const [createSprintOpen, setCreateSprintOpen] = useState(false)
  const [createEpicOpen,   setCreateEpicOpen]   = useState(false)
  const [completeId,       setCompleteId]       = useState<string | null>(null)
  const [issueModal, setIssueModal] = useState<{ open: boolean; sprintId?: string }>({ open: false })

  // Apply epic filter
  const filteredIssues = useMemo(
    () => selectedEpicId ? allIssues.filter((i) => i.epicId === selectedEpicId) : allIssues,
    [allIssues, selectedEpicId],
  )

  // Sort: ACTIVE → PLANNED (by startDate) → COMPLETED
  const sortedSprints = useMemo(
    () => [...sprints].sort((a, b) => {
      const order = { ACTIVE: 0, PLANNED: 1, COMPLETED: 2 }
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
      return new Date(a.startDate ?? 0).getTime() - new Date(b.startDate ?? 0).getTime()
    }),
    [sprints],
  )

  // Group issues by sprint
  const issuesBySprint = useMemo(() => {
    const map = new Map<string | null, Issue[]>()
    map.set(null, [])
    for (const s of sortedSprints) map.set(s.id, [])
    for (const issue of filteredIssues) {
      const key = issue.sprintId ?? null
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(issue)
    }
    return map
  }, [filteredIssues, sortedSprints])

  const handleMove = async (issueId: string, sprintId: string | null) => {
    try {
      await issuesApi.update(issueId, { sprintId } as Partial<Issue>)
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(boardId!) })
      toast.success(sprintId ? 'Added to sprint' : 'Moved to backlog')
    } catch {
      toast.error('Failed to move issue')
    }
  }

  const handleStart = async (sprintId: string) => {
    try {
      await sprintsApi.start(sprintId)
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all(boardId!) })
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(boardId!) })
      toast.success('Sprint started')
    } catch {
      toast.error('Failed to start sprint — make sure no other sprint is active')
    }
  }

  const handleComplete = async (sprintId: string, moveToId: string | null) => {
    try {
      await sprintsApi.complete(sprintId, { moveIncompleteToSprintId: moveToId })
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all(boardId!) })
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(boardId!) })
      setCompleteId(null)
      toast.success('Sprint completed')
    } catch {
      toast.error('Failed to complete sprint')
    }
  }

  const visibleSprints = sortedSprints.filter((s) => s.status !== 'COMPLETED')
  const backlogIssues  = issuesBySprint.get(null) ?? []
  const backlogTotal   = allIssues.filter((i) => !i.sprintId).length
  const completingSprint = completeId ? sortedSprints.find((s) => s.id === completeId) : null

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-surface-border bg-surface px-5 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-text-primary">Backlog</h1>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
            {allIssues.length} issues
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateEpicOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            Epic
          </button>
          <button
            onClick={() => setCreateSprintOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            Sprint
          </button>
          <button
            onClick={() => setIssueModal({ open: true })}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-light"
          >
            <Plus className="h-3.5 w-3.5" />
            Issue
          </button>
        </div>
      </div>

      {/* Epic filter bar */}
      {epics.length > 0 && (
        <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-surface-border bg-surface px-5 py-2">
          <span className="shrink-0 text-xs font-medium text-text-muted">Epic:</span>
          <button
            onClick={() => setSelectedEpicId(null)}
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
              selectedEpicId === null
                ? 'bg-primary text-white'
                : 'bg-surface-muted text-text-muted hover:text-text-primary',
            )}
          >
            All
          </button>
          {epics.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelectedEpicId(selectedEpicId === e.id ? null : e.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                selectedEpicId === e.id ? 'text-white' : 'bg-surface-muted text-text-muted hover:text-text-primary',
              )}
              style={selectedEpicId === e.id ? { backgroundColor: e.color } : undefined}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: selectedEpicId === e.id ? 'rgba(255,255,255,0.75)' : e.color }}
              />
              {e.title}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {(issLoading || spLoading) ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        ) : (
          <div className="mx-auto max-w-4xl px-6 py-5">
            {/* Sprint sections (active + planned) */}
            {visibleSprints.map((sprint) => (
              <SprintSection
                key={sprint.id}
                sprint={sprint}
                issues={issuesBySprint.get(sprint.id) ?? []}
                epicsMap={epicsMap}
                allSprints={sortedSprints}
                onOpen={setDetailIssueId}
                onMove={handleMove}
                onStart={handleStart}
                onComplete={(id) => setCompleteId(id)}
                onAddIssue={(sprintId) => setIssueModal({ open: true, sprintId })}
              />
            ))}

            {/* Backlog */}
            <BacklogSection
              issues={backlogIssues}
              totalCount={backlogTotal}
              epicsMap={epicsMap}
              sprints={sortedSprints}
              onOpen={setDetailIssueId}
              onMove={handleMove}
              onAddIssue={() => setIssueModal({ open: true })}
              onCreateSprint={() => setCreateSprintOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {createSprintOpen && (
        <CreateSprintModal boardId={boardId!} onClose={() => setCreateSprintOpen(false)} />
      )}
      {createEpicOpen && (
        <CreateEpicModal boardId={boardId!} onClose={() => setCreateEpicOpen(false)} />
      )}
      {completingSprint && (
        <CompleteSprintModal
          sprint={completingSprint}
          otherSprints={sortedSprints.filter((s) => s.id !== completeId)}
          onConfirm={(moveToId) => handleComplete(completeId!, moveToId)}
          onClose={() => setCompleteId(null)}
        />
      )}

      <CreateIssueModal
        open={issueModal.open}
        onClose={() => setIssueModal({ open: false })}
        boardId={boardId!}
        boardKey={board?.boardKey}
        boardName={board?.name}
        sprintId={issueModal.sprintId}
      />

      {detailIssueId && (
        <IssueDetailPanel
          issueId={detailIssueId}
          boardId={boardId!}
          columns={board?.columns ?? []}
          onClose={() => setDetailIssueId(null)}
        />
      )}
    </div>
  )
}
