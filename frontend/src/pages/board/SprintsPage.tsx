import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus, Play, CheckCircle, Clock, Target,
  Loader2, ChevronDown, ChevronRight,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSprints, sprintsApi } from '@/api/sprints'
import { useIssues } from '@/api/issues'
import { queryKeys } from '@/api/queryKeys'
import { cn } from '@/utils/cn'
import { CreateSprintModal } from '@/components/sprint/CreateSprintModal'
import type { Sprint } from '@/types/sprint'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysLeft(endDate: string | null) {
  if (!endDate) return null
  const diff = new Date(endDate).getTime() - Date.now()
  const days = Math.ceil(diff / 86_400_000)
  return days
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
          {eligible.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
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

// ── Sprint card ────────────────────────────────────────────────────────────────

function SprintCard({
  sprint,
  boardId,
  allSprints,
  issueCount,
  onStart,
  onComplete,
}: {
  sprint: Sprint
  boardId: string
  allSprints: Sprint[]
  issueCount: number
  onStart: (id: string) => void
  onComplete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(sprint.status === 'ACTIVE')
  const progress = sprint.totalIssues > 0
    ? Math.round((sprint.completedIssues / sprint.totalIssues) * 100)
    : 0
  const pointsProgress = sprint.totalPoints > 0
    ? Math.round((sprint.completedPoints / sprint.totalPoints) * 100)
    : 0
  const days = daysLeft(sprint.endDate)
  const overdue = days !== null && days < 0

  const statusConfig = {
    ACTIVE:    { label: 'Active',     ring: 'ring-green-500/30',  bg: 'bg-green-500/8',   dot: 'bg-green-500'  },
    PLANNED:   { label: 'Planned',    ring: 'ring-surface-border', bg: 'bg-surface',       dot: 'bg-text-muted' },
    COMPLETED: { label: 'Completed',  ring: 'ring-surface-border', bg: 'bg-surface-muted', dot: 'bg-text-muted' },
  }[sprint.status]

  return (
    <div className={cn('mb-3 rounded-xl border bg-surface p-4 ring-1 transition-all', statusConfig.ring, statusConfig.bg)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-0.5 shrink-0 text-text-muted hover:text-text-primary"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', statusConfig.dot)} />
            <h3 className="font-semibold text-text-primary truncate">{sprint.name}</h3>
            <span className="shrink-0 rounded-full border border-surface-border px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
              {statusConfig.label}
            </span>
            {sprint.status === 'ACTIVE' && days !== null && (
              <span className={cn('shrink-0 text-xs font-medium', overdue ? 'text-red-500' : 'text-text-muted')}>
                {overdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
              </span>
            )}fro
          </div>
          {sprint.goal && (
            <p className="text-xs text-text-secondary">{sprint.goal}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {sprint.status === 'PLANNED' && (
            <button
              onClick={() => onStart(sprint.id)}
              className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-primary/30 hover:text-primary"
            >
              <Play className="h-3.5 w-3.5" />
              Start Sprint
            </button>
          )}
          {sprint.status === 'ACTIVE' && (
            <button
              onClick={() => onComplete(sprint.id)}
              className="flex items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-600 transition-colors hover:bg-green-500/20"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Complete Sprint
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 grid grid-cols-4 gap-3 border-t border-surface-border pt-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Start</span>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Clock className="h-3 w-3 shrink-0" />
              {fmtDate(sprint.startDate)}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">End</span>
            <div className={cn('flex items-center gap-1.5 text-xs', overdue && sprint.status === 'ACTIVE' ? 'text-red-500' : 'text-text-secondary')}>
              <Clock className="h-3 w-3 shrink-0" />
              {fmtDate(sprint.endDate)}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Issues</span>
            <span className="text-xs text-text-secondary">
              {sprint.completedIssues}/{sprint.totalIssues || issueCount}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Points</span>
            <div className="flex items-center gap-1.5">
              <Target className="h-3 w-3 shrink-0 text-text-muted" />
              <span className="text-xs text-text-secondary">
                {sprint.completedPoints}/{sprint.totalPoints}
              </span>
            </div>
          </div>

          {/* Progress bars */}
          {sprint.totalIssues > 0 && (
            <div className="col-span-4 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-text-muted">
                <span>Issue progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-border">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {sprint.totalPoints > 0 && (
            <div className="col-span-4 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-text-muted">
                <span>Story points</span>
                <span>{pointsProgress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-border">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${pointsProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SprintsPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const queryClient = useQueryClient()

  const { data: sprints = [], isLoading: spLoading } = useSprints(boardId!)
  const { data: issuesPage }                         = useIssues(boardId!)
  const [createOpen,   setCreateOpen]   = useState(false)
  const [completeId,   setCompleteId]   = useState<string | null>(null)

  const sortedSprints = [...sprints].sort((a, b) => {
    const order = { ACTIVE: 0, PLANNED: 1, COMPLETED: 2 }
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
    return new Date(a.startDate ?? 0).getTime() - new Date(b.startDate ?? 0).getTime()
  })

  const issueCountBySprint = new Map<string, number>()
  for (const issue of issuesPage?.content ?? []) {
    if (issue.sprintId) {
      issueCountBySprint.set(issue.sprintId, (issueCountBySprint.get(issue.sprintId) ?? 0) + 1)
    }
  }

  const handleStart = async (sprintId: string) => {
    try {
      await sprintsApi.start(sprintId)
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all(boardId!) })
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

  const completingSprint = completeId ? sortedSprints.find((s) => s.id === completeId) : null
  const activeSprint  = sortedSprints.find((s) => s.status === 'ACTIVE')
  const plannedCount  = sortedSprints.filter((s) => s.status === 'PLANNED').length
  const completedCount = sortedSprints.filter((s) => s.status === 'COMPLETED').length

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-surface-border bg-surface px-5 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-text-primary">Sprints</h1>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            {activeSprint && (
              <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 font-medium text-green-600">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                1 active
              </span>
            )}
            {plannedCount > 0 && (
              <span className="rounded-full bg-surface-muted px-2 py-0.5">
                {plannedCount} planned
              </span>
            )}
            {completedCount > 0 && (
              <span className="rounded-full bg-surface-muted px-2 py-0.5">
                {completedCount} completed
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-light"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Sprint
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {spLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        ) : sortedSprints.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-xl border border-dashed border-surface-border p-8">
              <Play className="mx-auto mb-3 h-8 w-8 text-text-muted" />
              <p className="text-sm font-medium text-text-primary">No sprints yet</p>
              <p className="mt-1 text-xs text-text-muted">Create a sprint to start planning your work.</p>
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-light mx-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                Create first sprint
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-6 py-5">
            {sortedSprints.map((sprint) => (
              <SprintCard
                key={sprint.id}
                sprint={sprint}
                boardId={boardId!}
                allSprints={sortedSprints}
                issueCount={issueCountBySprint.get(sprint.id) ?? 0}
                onStart={handleStart}
                onComplete={(id) => setCompleteId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {createOpen && (
        <CreateSprintModal boardId={boardId!} existingSprints={sortedSprints} onClose={() => setCreateOpen(false)} />
      )}
      {completingSprint && (
        <CompleteSprintModal
          sprint={completingSprint}
          otherSprints={sortedSprints.filter((s) => s.id !== completeId)}
          onConfirm={(moveToId) => handleComplete(completeId!, moveToId)}
          onClose={() => setCompleteId(null)}
        />
      )}
    </div>
  )
}
