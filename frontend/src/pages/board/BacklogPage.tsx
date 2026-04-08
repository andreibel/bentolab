import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useParams} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {ChevronDown, ChevronRight, Loader2, Pencil, Play, Plus, X,} from 'lucide-react'
import {EpicTag, IssueTypeIcon, PriorityIcon} from '@/components/ui/Badge'
import {Avatar} from '@/components/ui/Avatar'
import {useQueryClient} from '@tanstack/react-query'
import {toast} from 'sonner'
import {issuesApi, useIssues} from '@/api/issues'
import {sprintsApi, useSprints} from '@/api/sprints'
import {epicsApi, useEpics} from '@/api/epics'
import {useBoard} from '@/api/boards'
import {queryKeys} from '@/api/queryKeys'
import {EpicFilter} from '@/components/board/EpicFilter'
import {IssueDetailPanel} from '@/components/issues/IssueDetailPanel'
import {CreateIssueModal} from '@/components/issues/CreateIssueModal'
import {CreateSprintModal} from '@/components/sprint/CreateSprintModal'
import {cn} from '@/utils/cn'
import type {Issue} from '@/types/issue'
import type {Sprint} from '@/types/sprint'
import type {Epic} from '@/types/epic'
import type {BoardColumn} from '@/types/board'

const EPIC_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899']

// ── Helpers ───────────────────────────────────────────────────────────────────

type TFunc = (key: string, opts?: Record<string, unknown>) => string

function fmtDateRange(start: string | null, end: string | null, t: TFunc): string | null {
  if (!start && !end) return null
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return t('backlog.dateFrom', { date: fmt(start) })
  return t('backlog.dateUntil', { date: fmt(end!) })
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
  const { t } = useTranslation()
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
        {issue.sprintId ? t('backlog.sprint.moveToSprint') : t('backlog.sprint.addToSprint')}
      </button>
      {open && (
        <div className="absolute start-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-surface-border bg-surface shadow-xl">
          {issue.sprintId && (
            <button
              onClick={(e) => { e.stopPropagation(); onMove(null); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-muted hover:bg-surface-muted"
            >
              {t('backlog.sprint.toBacklog')}
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
            <div className="px-3 py-2 text-xs text-text-muted">{t('backlog.sprint.noActiveSprints')}</div>
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
  const { t } = useTranslation()
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

      {issue.closed && (
        <span className="shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
          {t('backlog.closedBadge')}
        </span>
      )}

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
  allSprintIssues,
  epicsMap,
  allSprints,
  onOpen,
  onMove,
  onStart,
  onComplete,
  onAddIssue,
  onEdit,
}: {
  sprint: Sprint
  issues: Issue[]            // tab-filtered, for display
  allSprintIssues: Issue[]   // all issues in sprint, for progress/counts
  epicsMap: Map<string, Epic>
  allSprints: Sprint[]
  onOpen: (id: string) => void
  onMove: (issueId: string, sprintId: string | null) => void
  onStart: (sprintId: string) => void
  onComplete: (sprintId: string) => void
  onAddIssue: (sprintId: string) => void
  onEdit: (sprintId: string) => void
}) {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)
  // Progress/counts always from ALL sprint issues regardless of open/closed tab filter
  const totalPts  = allSprintIssues.reduce((s, i) => s + (i.storyPoints ?? 0), 0)
  const doneCount = allSprintIssues.filter((i) => i.closed).length
  const progress  = allSprintIssues.length > 0
    ? Math.round((doneCount / allSprintIssues.length) * 100)
    : 0
  const dateRange = fmtDateRange(sprint.startDate, sprint.endDate, t as TFunc)

  return (
    <div className="mb-3">
      <div className="group flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-surface-muted/40">
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
            {t('backlog.sprint.active')}
          </span>
        )}
        {sprint.status === 'PLANNED' && (
          <span className="shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
            {t('backlog.sprint.planned')}
          </span>
        )}

        {dateRange && (
          <span className="shrink-0 text-xs text-text-muted">{dateRange}</span>
        )}

        <span className="shrink-0 text-xs text-text-muted">
          {doneCount > 0
            ? t('backlog.sprint.doneFraction', { done: doneCount, total: allSprintIssues.length })
            : t('backlog.sprint.issueCount', { count: allSprintIssues.length })}
          {totalPts > 0 && ` · ${totalPts} ${t('backlog.sprint.pts')}`}
        </span>

        {sprint.status === 'ACTIVE' && allSprintIssues.length > 0 && (
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
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(sprint.id) }}
            className="rounded p-1 text-text-muted opacity-0 transition-all hover:bg-surface-muted hover:text-text-primary group-hover:opacity-100"
            aria-label={t('backlog.sprint.editSprint')}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {sprint.status === 'PLANNED' && (
            <button
              onClick={(e) => { e.stopPropagation(); onStart(sprint.id) }}
              className="rounded-md border border-surface-border px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-primary/30 hover:text-primary"
            >
              {t('backlog.sprint.startSprint')}
            </button>
          )}
          {sprint.status === 'ACTIVE' && (
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(sprint.id) }}
              className="rounded-md border border-surface-border px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-green-500/30 hover:text-green-600"
            >
              {t('backlog.sprint.complete')}
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
            {t('backlog.sprint.addIssue')}
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
  const { t } = useTranslation()
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
        <span className="flex-1 text-sm font-semibold text-text-primary">{t('backlog.backlogSection.title')}</span>
        <span className="text-xs text-text-muted">{t('backlog.sprint.issueCount', { count: totalCount })}</span>
        <button
          onClick={onCreateSprint}
          className="flex items-center gap-1 rounded-md border border-surface-border px-2 py-1 text-xs text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
        >
          <Plus className="h-3 w-3" />
          {t('backlog.backlogSection.newSprint')}
        </button>
      </div>

      {!collapsed && (
        <div className="ms-4 border-s border-surface-border/50 ps-3">
          {issues.length === 0 && (
            <p className="py-6 text-center text-xs text-text-muted">{t('backlog.backlogSection.noIssues')}</p>
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
            {t('backlog.sprint.addIssue')}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Pull-to-board menu (Kanban) ───────────────────────────────────────────────

function PullToBoardMenu({
  columns,
  onPull,
}: {
  columns: BoardColumn[]
  onPull: (columnId: string) => void
}) {
  const { t } = useTranslation()
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-text-muted transition-colors hover:bg-surface-border hover:text-text-primary"
      >
        {t('backlog.kanban.pullToBoard')}
      </button>
      {open && (
        <div className="absolute start-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-surface-border bg-surface shadow-xl">
          {columns.map((col) => (
            <button
              key={col.id}
              onClick={(e) => { e.stopPropagation(); onPull(col.id); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-surface-muted"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: col.color ?? '#6B7280' }}
              />
              {col.name}
            </button>
          ))}
          {columns.length === 0 && (
            <div className="px-3 py-2 text-xs text-text-muted">{t('backlog.kanban.noColumns')}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Kanban backlog section ─────────────────────────────────────────────────────

function KanbanBacklogSection({
  issues,
  columns,
  epicsMap,
  onOpen,
  onPull,
  onAddIssue,
}: {
  issues: Issue[]
  columns: BoardColumn[]
  epicsMap: Map<string, Epic>
  onOpen: (id: string) => void
  onPull: (issueId: string, columnId: string) => void
  onAddIssue: () => void
}) {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div>
      <div className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-surface-muted/40">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="shrink-0 text-text-muted hover:text-text-primary"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <span className="flex-1 text-sm font-semibold text-text-primary">{t('backlog.backlogSection.title')}</span>
        <span className="text-xs text-text-muted">{t('backlog.sprint.issueCount', { count: issues.length })}</span>
      </div>

      {!collapsed && (
        <div className="ms-4 border-s border-surface-border/50 ps-3">
          {issues.length === 0 && (
            <p className="py-6 text-center text-xs text-text-muted">{t('backlog.backlogSection.noIssues')}</p>
          )}
          {issues.map((issue) => {
            const epic = issue.epicId ? epicsMap.get(issue.epicId) : undefined
            return (
              <div
                key={issue.id}
                onClick={() => onOpen(issue.id)}
                className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-muted/60"
              >
                <div className="shrink-0"><IssueTypeIcon type={issue.type} /></div>
                <span className="w-16 shrink-0 font-mono text-[11px] text-text-muted">{issue.issueKey}</span>
                <span className="flex-1 truncate text-sm text-text-primary">{issue.title}</span>
                {epic && <EpicTag title={epic.title} color={epic.color} />}
                {issue.closed && (
                  <span className="shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
                    {t('backlog.closedBadge')}
                  </span>
                )}
                <div className="shrink-0"><PriorityIcon priority={issue.priority} /></div>
                <Avatar userId={issue.assigneeId} size="sm" className="shrink-0" />
                <div
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PullToBoardMenu columns={columns} onPull={(colId) => onPull(issue.id, colId)} />
                </div>
              </div>
            )
          })}
          <button
            onClick={onAddIssue}
            className="flex items-center gap-2 px-3 py-2 text-xs text-text-muted transition-colors hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('backlog.sprint.addIssue')}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Create Epic Modal ─────────────────────────────────────────────────────────

function CreateEpicModal({ boardId, onClose }: { boardId: string; onClose: () => void }) {
  const { t } = useTranslation()
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
      toast.success(t('backlog.epics.created'))
      onClose()
    } catch {
      toast.error(t('backlog.epics.failedToCreate'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-[400px] rounded-2xl border border-surface-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <h2 className="text-base font-semibold text-text-primary">{t('backlog.epics.createTitle')}</h2>
          <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-surface-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">{t('backlog.epics.nameLabel')}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('backlog.epics.namePlaceholder')}
              required autoFocus
              className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-text-muted">{t('backlog.epics.colorLabel')}</label>
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
              {t('backlog.epics.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: color }}
            >
              {submitting ? t('backlog.epics.creating') : t('backlog.epics.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Edit Epic Modal ────────────────────────────────────────────────────────────

function EditEpicModal({ epic, boardId, onClose }: { epic: Epic; boardId: string; onClose: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [title,     setTitle]     = useState(epic.title)
  const [color,     setColor]     = useState(epic.color)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await epicsApi.update(epic.id, { title: title.trim(), color })
      queryClient.invalidateQueries({ queryKey: queryKeys.epics.list(boardId) })
      toast.success(t('backlog.epics.updated'))
      onClose()
    } catch {
      toast.error(t('backlog.epics.failedToUpdate'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-[400px] rounded-2xl border border-surface-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <h2 className="text-base font-semibold text-text-primary">{t('backlog.epics.editTitle')}</h2>
          <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-surface-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">{t('backlog.epics.nameLabel')}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-text-muted">{t('backlog.epics.colorLabel')}</label>
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
              {t('backlog.epics.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: color }}
            >
              {submitting ? t('backlog.epics.saving') : t('backlog.epics.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Edit Sprint Modal ──────────────────────────────────────────────────────────

function EditSprintModal({ sprint, boardId, onClose }: { sprint: Sprint; boardId: string; onClose: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [name,       setName]       = useState(sprint.name)
  const [goal,       setGoal]       = useState(sprint.goal ?? '')
  const [startDate,  setStartDate]  = useState(sprint.startDate?.slice(0, 10) ?? '')
  const [endDate,    setEndDate]    = useState(sprint.endDate?.slice(0, 10) ?? '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await sprintsApi.update(sprint.id, {
        name:      name.trim(),
        goal:      goal.trim() || undefined,
        startDate: startDate || undefined,
        endDate:   endDate   || undefined,
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all(boardId) })
      toast.success(t('backlog.sprintModals.updated'))
      onClose()
    } catch {
      toast.error(t('backlog.sprintModals.failedToUpdate'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-[440px] rounded-2xl border border-surface-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <h2 className="text-base font-semibold text-text-primary">{t('backlog.sprintModals.editTitle')}</h2>
          <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-surface-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">{t('backlog.sprintModals.nameLabel')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">{t('backlog.sprintModals.goalLabel')}</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              placeholder={t('backlog.sprintModals.goalPlaceholder')}
              className="w-full resize-none rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-text-muted">{t('backlog.sprintModals.startDate')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-text-muted">{t('backlog.sprintModals.endDate')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-text-muted hover:text-text-primary">
              {t('backlog.sprintModals.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:opacity-40"
            >
              {submitting ? t('backlog.sprintModals.saving') : t('backlog.sprintModals.save')}
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
  const { t } = useTranslation()
  const [moveToId, setMoveToId] = useState('')
  const eligible = otherSprints.filter((s) => s.status !== 'COMPLETED')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-[420px] rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
        <h2 className="mb-1 text-base font-semibold text-text-primary">{t('backlog.completeModal.title', { name: sprint.name })}</h2>
        <p className="mb-4 text-sm text-text-secondary">
          {t('backlog.completeModal.description')}
        </p>
        <select
          value={moveToId}
          onChange={(e) => setMoveToId(e.target.value)}
          className="mb-5 w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
        >
          <option value="">{t('backlog.completeModal.moveToBacklog')}</option>
          {eligible.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-text-muted hover:text-text-primary">
            {t('backlog.completeModal.cancel')}
          </button>
          <button
            onClick={() => onConfirm(moveToId || null)}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            {t('backlog.completeModal.complete')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BacklogPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: board }                           = useBoard(boardId!)
  const { data: issuesPage, isLoading: issLoading } = useIssues(boardId!)
  const { data: sprints = [], isLoading: spLoading } = useSprints(boardId!)
  const { data: epics   = [] }                    = useEpics(boardId!)

  const isKanban  = board?.boardType === 'KANBAN'
  const boardCols = [...(board?.columns ?? [])].sort((a, b) => a.position - b.position)

  const allIssues = issuesPage?.content ?? []
  const epicsMap  = useMemo(() => new Map(epics.map((e) => [e.id, e])), [epics])

  const [selectedEpicIds, setSelectedEpicIds] = useState<Set<string>>(new Set())
  const [detailIssueId,   setDetailIssueId]   = useState<string | null>(null)
  const MIN_PANEL = 680
  const [panelWidth, setPanelWidth] = useState(MIN_PANEL)

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = panelWidth
    const onMove = (ev: MouseEvent) => {
      const maxPanel = Math.max(window.innerWidth / 2, MIN_PANEL)
      setPanelWidth(Math.min(maxPanel, Math.max(MIN_PANEL, startW + (startX - ev.clientX))))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [panelWidth])

  function closeDetail() {
    setDetailIssueId(null)
    setPanelWidth(MIN_PANEL)
  }

  const [createSprintOpen, setCreateSprintOpen] = useState(false)
  const [createEpicOpen,   setCreateEpicOpen]   = useState(false)
  const [completeId,       setCompleteId]       = useState<string | null>(null)
  const [editSprintId,     setEditSprintId]     = useState<string | null>(null)
  const [editEpicId,       setEditEpicId]       = useState<string | null>(null)
  const [issueModal, setIssueModal] = useState<{ open: boolean; sprintId?: string }>({ open: false })
  const [closedTab, setClosedTab] = useState<'open' | 'closed' | 'all'>('open')

  // Apply closed tab filter first, then epic filter
  const tabFilteredIssues = useMemo(() => {
    if (closedTab === 'open')   return allIssues.filter((i) => !i.closed)
    if (closedTab === 'closed') return allIssues.filter((i) => i.closed)
    return allIssues
  }, [allIssues, closedTab])

  const filteredIssues = useMemo(
    () => selectedEpicIds.size > 0
      ? tabFilteredIssues.filter((i) => i.epicId != null && selectedEpicIds.has(i.epicId))
      : tabFilteredIssues,
    [tabFilteredIssues, selectedEpicIds],
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

  // Group filtered issues by sprint (for display, respects open/closed tab)
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

  // Group ALL issues by sprint (for progress/counts, ignores tab filter)
  const allIssuesBySprint = useMemo(() => {
    const map = new Map<string, Issue[]>()
    for (const issue of allIssues) {
      if (!issue.sprintId) continue
      if (!map.has(issue.sprintId)) map.set(issue.sprintId, [])
      map.get(issue.sprintId)!.push(issue)
    }
    return map
  }, [allIssues])

  const handleMove = async (issueId: string, sprintId: string | null) => {
    try {
      await issuesApi.update(issueId, { sprintId } as Partial<Issue>)
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(boardId!) })
      toast.success(sprintId ? t('backlog.toasts.addedToSprint') : t('backlog.toasts.movedToBacklog'))
    } catch {
      toast.error(t('backlog.toasts.failedToMove'))
    }
  }

  const handlePull = async (issueId: string, columnId: string) => {
    try {
      await issuesApi.update(issueId, { columnId } as Partial<Issue>)
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(boardId!) })
      toast.success(t('backlog.toasts.pulledToBoard'))
    } catch {
      toast.error(t('backlog.toasts.failedToPull'))
    }
  }

  const handleStart = async (sprintId: string) => {
    try {
      await sprintsApi.start(sprintId)
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all(boardId!) })
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(boardId!) })
      toast.success(t('backlog.toasts.sprintStarted'))
    } catch {
      toast.error(t('backlog.toasts.failedToStart'))
    }
  }

  const handleComplete = async (sprintId: string, moveToId: string | null) => {
    try {
      await sprintsApi.complete(sprintId, { moveIncompleteToSprintId: moveToId })
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all(boardId!) })
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(boardId!) })
      setCompleteId(null)
      toast.success(t('backlog.toasts.sprintCompleted'))
    } catch {
      toast.error(t('backlog.toasts.failedToComplete'))
    }
  }

  const visibleSprints = sortedSprints.filter((s) => s.status !== 'COMPLETED')
  const backlogIssues  = issuesBySprint.get(null) ?? []
  const backlogTotal   = tabFilteredIssues.filter((i) => !i.sprintId).length
  const completingSprint = completeId ? sortedSprints.find((s) => s.id === completeId) : null

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-surface-border bg-surface px-5 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-text-primary">{t('backlog.title')}</h1>
          <div className="flex items-center rounded-lg bg-surface-muted p-0.5 text-xs">
            {(['open', 'closed', 'all'] as const).map((tab) => {
              const count = tab === 'open'
                ? allIssues.filter((i) => !i.closed).length
                : tab === 'closed'
                  ? allIssues.filter((i) => i.closed).length
                  : allIssues.length
              return (
                <button
                  key={tab}
                  onClick={() => setClosedTab(tab)}
                  className={cn(
                    'rounded-md px-2.5 py-1 font-medium transition-colors',
                    closedTab === tab
                      ? 'bg-surface text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-primary',
                  )}
                >
                  {t(`backlog.tabs.${tab}`)} <span className="ms-1 text-[10px] opacity-70">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {epics.length > 0 && (
            <EpicFilter
              epics={epics}
              selected={selectedEpicIds}
              onChange={setSelectedEpicIds}
              onEditEpic={(id) => setEditEpicId(id)}
            />
          )}
          <button
            onClick={() => setCreateEpicOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('backlog.buttons.epic')}
          </button>
          {!isKanban && (
            <button
              onClick={() => setCreateSprintOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('backlog.buttons.sprint')}
            </button>
          )}
          <button
            onClick={() => setIssueModal({ open: true })}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-light"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('backlog.buttons.issue')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {(issLoading || (!isKanban && spLoading)) ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        ) : (
          <div className="mx-auto max-w-4xl px-6 py-5">
            {isKanban ? (
              <KanbanBacklogSection
                issues={filteredIssues.filter((i) => !i.columnId)}
                columns={boardCols}
                epicsMap={epicsMap}
                onOpen={setDetailIssueId}
                onPull={handlePull}
                onAddIssue={() => setIssueModal({ open: true })}
              />
            ) : (
              <>
                {/* Sprint sections (active + planned) */}
                {visibleSprints.map((sprint) => (
                  <SprintSection
                    key={sprint.id}
                    sprint={sprint}
                    issues={issuesBySprint.get(sprint.id) ?? []}
                    allSprintIssues={allIssuesBySprint.get(sprint.id) ?? []}
                    epicsMap={epicsMap}
                    allSprints={sortedSprints}
                    onOpen={setDetailIssueId}
                    onMove={handleMove}
                    onStart={handleStart}
                    onComplete={(id) => setCompleteId(id)}
                    onAddIssue={(sprintId) => setIssueModal({ open: true, sprintId })}
                    onEdit={(id) => setEditSprintId(id)}
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
              </>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {createSprintOpen && (
        <CreateSprintModal boardId={boardId!} existingSprints={sprints} onClose={() => setCreateSprintOpen(false)} />
      )}
      {createEpicOpen && (
        <CreateEpicModal boardId={boardId!} onClose={() => setCreateEpicOpen(false)} />
      )}
      {editSprintId && (() => {
        const sprint = sortedSprints.find((s) => s.id === editSprintId)
        return sprint ? (
          <EditSprintModal sprint={sprint} boardId={boardId!} onClose={() => setEditSprintId(null)} />
        ) : null
      })()}
      {editEpicId && (() => {
        const epic = epics.find((e) => e.id === editEpicId)
        return epic ? (
          <EditEpicModal epic={epic} boardId={boardId!} onClose={() => setEditEpicId(null)} />
        ) : null
      })()}
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
      </div>

      {detailIssueId && (
        <>
          <div
            onMouseDown={startResize}
            className="w-1 shrink-0 cursor-col-resize bg-surface-border transition-colors hover:bg-primary/40"
          />
          <div style={{ width: panelWidth }} className="shrink-0 overflow-hidden">
            <IssueDetailPanel
              issueId={detailIssueId}
              boardId={boardId!}
              columns={board?.columns ?? []}
              onClose={closeDetail}
            />
          </div>
        </>
      )}
    </div>
  )
}
