import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  ChevronRight, ChevronDown, Plus, Flag, X, Trash2,
  CalendarDays, Layers,
} from 'lucide-react'
import {
  format, parseISO, differenceInDays, addDays, addMonths,
  startOfMonth, endOfMonth, startOfWeek, isValid,
} from 'date-fns'
import { toast } from 'sonner'
import { useIssues } from '@/api/issues'
import { useEpics } from '@/api/epics'
import { useSprints } from '@/api/sprints'
import { useMilestones, useCreateMilestone, useUpdateMilestone, useDeleteMilestone } from '@/api/milestones'
import { useBoard } from '@/api/boards'
import { IssueDetailPanel } from '@/components/issues/IssueDetailPanel'
import { ColorPicker } from '@/components/common/ColorPicker'
import { cn } from '@/utils/cn'
import type { Issue } from '@/types/issue'
import type { Epic } from '@/types/epic'
import type { Sprint } from '@/types/sprint'
import type { Milestone } from '@/types/milestone'

// ── Types & constants ──────────────────────────────────────────────────────────

type Zoom    = 'week' | 'month' | 'quarter' | 'year'
type GroupBy = 'epic' | 'sprint' | 'none'

const DAY_WIDTH: Record<Zoom, number> = { week: 56, month: 30, quarter: 13, year: 5 }
const LEFT_W         = 264   // px — left label panel width
const ROW_H          = 40    // px — default row height
const GROUP_H        = 44    // px — group header row height
const SPRINT_TRACK_H = 36    // px — single sprint-track row height
const HEADER_H       = 54    // px — date header height (2 sub-rows)

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#eab308',
  LOW:      '#60a5fa',
}

const MILESTONE_PALETTE = [
  '#f59e0b', '#6366f1', '#ec4899', '#10b981',
  '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4',
]

type GanttRow =
  | { kind: 'milestone';    id: string; milestone: Milestone }
  | { kind: 'epic';         id: string; epic: Epic;       collapsed: boolean }
  | { kind: 'sprint-track'; id: '__sprints__'; sprints: Sprint[] }
  | { kind: 'issue';        id: string; issue: Issue;     indent: number }
  | { kind: 'divider';      id: string; label: string;    collapsed: boolean }

// ── Date helpers ───────────────────────────────────────────────────────────────

function pd(s: string | null | undefined): Date | null {
  if (!s) return null
  const d = parseISO(s)
  return isValid(d) ? d : null
}

function xOf(viewStart: Date, date: Date, dayWidth: number): number {
  return differenceInDays(date, viewStart) * dayWidth
}

function wOf(start: Date, end: Date, dayWidth: number): number {
  return Math.max(differenceInDays(end, start) + 1, 1) * dayWidth
}

// ── Header segment generators ──────────────────────────────────────────────────

interface Seg { label: string; left: number; width: number; isWeekend?: boolean }

/** Top-row: one segment per month */
function monthSegs(viewStart: Date, viewEnd: Date, dw: number): Seg[] {
  const segs: Seg[] = []
  let cur = startOfMonth(viewStart)
  while (cur <= viewEnd) {
    const mEnd  = endOfMonth(cur)
    const from  = cur  < viewStart ? viewStart : cur
    const to    = mEnd > viewEnd   ? viewEnd   : mEnd
    const left  = Math.max(0, differenceInDays(from, viewStart)) * dw
    const width = (differenceInDays(to, from) + 1) * dw
    segs.push({ label: format(cur, 'MMM yyyy'), left, width })
    cur = addMonths(cur, 1)
  }
  return segs
}

/** Top-row for week zoom: one segment per ISO week */
function weekRangeSegs(viewStart: Date, viewEnd: Date, dw: number): Seg[] {
  const segs: Seg[] = []
  let w = startOfWeek(viewStart, { weekStartsOn: 1 })
  while (w <= viewEnd) {
    const from  = w < viewStart ? viewStart : w
    const wEnd  = addDays(w, 6)
    const to    = wEnd > viewEnd ? viewEnd : wEnd
    const left  = Math.max(0, differenceInDays(from, viewStart)) * dw
    const width = (differenceInDays(to, from) + 1) * dw
    segs.push({ label: format(w, 'MMM d') + ' – ' + format(wEnd, 'd'), left, width })
    w = addDays(w, 7)
  }
  return segs
}

/** Bottom-row for month zoom: every day number ("1" … "31") */
function dayNumSegs(viewStart: Date, viewEnd: Date, dw: number): Seg[] {
  const segs: Seg[] = []
  let d = new Date(viewStart)
  while (d <= viewEnd) {
    const dow = d.getDay()
    segs.push({
      label: format(d, 'd'),
      left:  differenceInDays(d, viewStart) * dw,
      width: dw,
      isWeekend: dow === 0 || dow === 6,
    })
    d = addDays(d, 1)
  }
  return segs
}

/** Bottom-row for week zoom: "Mon 13", "Tue 14", … */
function dayOfWeekSegs(viewStart: Date, viewEnd: Date, dw: number): Seg[] {
  const segs: Seg[] = []
  let d = new Date(viewStart)
  while (d <= viewEnd) {
    const dow = d.getDay()
    segs.push({
      label: format(d, 'EEE d'),
      left:  differenceInDays(d, viewStart) * dw,
      width: dw,
      isWeekend: dow === 0 || dow === 6,
    })
    d = addDays(d, 1)
  }
  return segs
}

/** Weekend column positions (for background shading) */
function weekendCols(viewStart: Date, viewEnd: Date, dw: number): number[] {
  const xs: number[] = []
  let d = new Date(viewStart)
  while (d <= viewEnd) {
    const dow = d.getDay()
    if (dow === 0 || dow === 6) xs.push(differenceInDays(d, viewStart) * dw)
    d = addDays(d, 1)
  }
  return xs
}

// ── View range computation ─────────────────────────────────────────────────────

function computeRange(
  issues: Issue[], epics: Epic[], sprints: Sprint[], milestones: Milestone[],
): { start: Date; end: Date } {
  const ts: number[] = []
  issues.forEach(i => {
    if (i.startDate) ts.push(parseISO(i.startDate).getTime())
    if (i.dueDate)   ts.push(parseISO(i.dueDate).getTime())
  })
  epics.forEach(e => {
    if (e.startDate) ts.push(parseISO(e.startDate).getTime())
    if (e.endDate)   ts.push(parseISO(e.endDate).getTime())
  })
  sprints.forEach(s => {
    if (s.startDate) ts.push(parseISO(s.startDate).getTime())
    if (s.endDate)   ts.push(parseISO(s.endDate).getTime())
  })
  milestones.forEach(m => ts.push(parseISO(m.date).getTime()))

  const now = new Date()
  if (ts.length === 0) {
    return { start: addDays(startOfMonth(now), -7), end: addDays(endOfMonth(addMonths(now, 2)), 7) }
  }
  return {
    start: addDays(new Date(Math.min(...ts)), -21),
    end:   addDays(new Date(Math.max(...ts)),  21),
  }
}

// ── Row building ───────────────────────────────────────────────────────────────

function buildRows(
  issues: Issue[],
  epics:  Epic[],
  sprints: Sprint[],
  milestones: Milestone[],
  groupBy: GroupBy,
  collapsed: Set<string>,
  show: { epics: boolean; sprints: boolean; issues: boolean; milestones: boolean },
): GanttRow[] {
  const rows: GanttRow[] = []

  // ── Milestones (always first) ────────────────────────────────────────────
  if (show.milestones) {
    ;[...milestones]
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach(m => rows.push({ kind: 'milestone', id: m.id, milestone: m }))
  }

  const sortedSprints = [...sprints].sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))

  // Sprints always render as a single flat track row (side-by-side bars)
  if (show.sprints && sortedSprints.length > 0) {
    rows.push({ kind: 'sprint-track', id: '__sprints__', sprints: sortedSprints })
  }

  if (groupBy === 'epic') {
    // Epics as collapsible groups
    if (show.epics) {
      ;[...epics]
        .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
        .forEach(e => {
          const isCollapsed = collapsed.has(e.id)
          rows.push({ kind: 'epic', id: e.id, epic: e, collapsed: isCollapsed })
          if (!isCollapsed && show.issues) {
            ;[...issues]
              .filter(i => i.epicId === e.id)
              .sort((a, b) => (a.startDate ?? a.createdAt).localeCompare(b.startDate ?? b.createdAt))
              .forEach(i => rows.push({ kind: 'issue', id: i.id, issue: i, indent: 1 }))
          }
        })
    }

    // Issues with no epic
    if (show.issues) {
      const orphans = issues.filter(i => !i.epicId)
      if (orphans.length > 0) {
        const divId = '__no_epic__'
        const isCollapsed = collapsed.has(divId)
        rows.push({ kind: 'divider', id: divId, label: 'No Epic', collapsed: isCollapsed })
        if (!isCollapsed) {
          ;[...orphans]
            .sort((a, b) => (a.startDate ?? a.createdAt).localeCompare(b.startDate ?? b.createdAt))
            .forEach(i => rows.push({ kind: 'issue', id: i.id, issue: i, indent: 0 }))
        }
      }
    }
  }

  else if (groupBy === 'sprint') {
    // Epics as flat bars
    if (show.epics) {
      ;[...epics]
        .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
        .forEach(e => rows.push({ kind: 'epic', id: e.id, epic: e, collapsed: false }))
    }

    // Issues grouped under sprint dividers
    if (show.sprints && show.issues) {
      sortedSprints.forEach(s => {
        const sprintIssues = [...issues].filter(i => i.sprintId === s.id)
        if (sprintIssues.length === 0) return
        const divId = `sprint-div-${s.id}`
        const isCollapsed = collapsed.has(divId)
        rows.push({ kind: 'divider', id: divId, label: s.name, collapsed: isCollapsed })
        if (!isCollapsed) {
          sprintIssues
            .sort((a, b) => (a.startDate ?? a.createdAt).localeCompare(b.startDate ?? b.createdAt))
            .forEach(i => rows.push({ kind: 'issue', id: i.id, issue: i, indent: 1 }))
        }
      })
    }

    // Backlog (no sprint)
    if (show.issues) {
      const backlog = issues.filter(i => !i.sprintId)
      if (backlog.length > 0) {
        const divId = '__backlog__'
        const isCollapsed = collapsed.has(divId)
        rows.push({ kind: 'divider', id: divId, label: 'Backlog', collapsed: isCollapsed })
        if (!isCollapsed) {
          ;[...backlog]
            .sort((a, b) => (a.startDate ?? a.createdAt).localeCompare(b.startDate ?? b.createdAt))
            .forEach(i => rows.push({ kind: 'issue', id: i.id, issue: i, indent: 0 }))
        }
      }
    }
  }

  else {
    // none — flat list
    if (show.epics) {
      ;[...epics]
        .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
        .forEach(e => rows.push({ kind: 'epic', id: e.id, epic: e, collapsed: false }))
    }
    if (show.issues) {
      ;[...issues]
        .sort((a, b) => (a.startDate ?? a.createdAt).localeCompare(b.startDate ?? b.createdAt))
        .forEach(i => rows.push({ kind: 'issue', id: i.id, issue: i, indent: 0 }))
    }
  }

  return rows
}

// ── Issue type icon letter ─────────────────────────────────────────────────────

function IssueTypeIcon({ type }: { type: Issue['type'] }) {
  const map: Record<Issue['type'], { letter: string; bg: string }> = {
    STORY:   { letter: 'S', bg: 'bg-emerald-500' },
    TASK:    { letter: 'T', bg: 'bg-blue-500'    },
    BUG:     { letter: 'B', bg: 'bg-red-500'     },
    SUBTASK: { letter: '↳', bg: 'bg-slate-400'   },
  }
  const { letter, bg } = map[type] ?? { letter: '?', bg: 'bg-slate-400' }
  return (
    <span className={cn('inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white', bg)}>
      {letter}
    </span>
  )
}

// ── Milestone modal ────────────────────────────────────────────────────────────

interface MilestoneModalProps {
  boardId: string
  milestone: Milestone | null
  onClose: () => void
}

function MilestoneModal({ boardId, milestone, onClose }: MilestoneModalProps) {
  const isEdit = milestone !== null
  const [title, setTitle]   = useState(milestone?.title ?? '')
  const [date,  setDate]    = useState(milestone ? format(parseISO(milestone.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
  const [color, setColor]   = useState(milestone?.color ?? MILESTONE_PALETTE[0])
  const [desc,  setDesc]    = useState(milestone?.description ?? '')
  const [status, setStatus] = useState<Milestone['status']>(milestone?.status ?? 'PLANNED')

  const createMutation = useCreateMilestone(boardId)
  const updateMutation = useUpdateMilestone(boardId)
  const deleteMutation = useDeleteMilestone(boardId)

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return }
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: milestone!.id,
          data: { title: title.trim(), description: desc || undefined, date: new Date(date).toISOString(), color, status: status as Milestone['status'] },
        })
        toast.success('Milestone updated')
      } else {
        await createMutation.mutateAsync({
          boardId, title: title.trim(), description: desc || undefined,
          date: new Date(date).toISOString(), color,
        })
        toast.success('Milestone created')
      }
      onClose()
    } catch {
      toast.error('Failed to save milestone')
    }
  }

  const handleDelete = async () => {
    if (!milestone) return
    try {
      await deleteMutation.mutateAsync(milestone.id)
      toast.success('Milestone deleted')
      onClose()
    } catch {
      toast.error('Failed to delete milestone')
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-surface-border bg-surface p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded" style={{ backgroundColor: color }}>
              <Flag className="h-3.5 w-3.5 text-white" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">
              {isEdit ? 'Edit Milestone' : 'New Milestone'}
            </h2>
          </div>
          <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Title</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Beta Launch, Feature Freeze…"
              className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Date */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Color */}
          <div>
            <ColorPicker value={color} onChange={setColor} colors={MILESTONE_PALETTE} label="Color" />
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as Milestone['status'])}
                className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="PLANNED">Planned</option>
                <option value="REACHED">Reached</option>
                <option value="MISSED">Missed</option>
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Description <span className="text-text-muted">(optional)</span></label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              placeholder="Optional notes…"
              className="w-full resize-none rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <div>
            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {isPending ? 'Saving…' : isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Milestone status style ─────────────────────────────────────────────────────

function milestoneStatusClass(status: Milestone['status']) {
  if (status === 'REACHED') return 'opacity-60'
  if (status === 'MISSED')  return 'opacity-40 grayscale'
  return ''
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function TimelinePage() {
  const { boardId = '' } = useParams<{ boardId: string }>()

  const { data: board }      = useBoard(boardId)
  const { data: issuePage }  = useIssues(boardId)
  const { data: epicsData }  = useEpics(boardId)
  const { data: sprintsData } = useSprints(boardId)
  const { data: msData }     = useMilestones(boardId)

  const issues     = issuePage?.content     ?? []
  const epics      = epicsData              ?? []
  const sprints    = sprintsData            ?? []
  const milestones = msData                 ?? []
  const columns    = board?.columns         ?? []

  // ── UI state ─────────────────────────────────────────────────────────────
  const [zoom,      setZoom]      = useState<Zoom>('month')
  const [groupBy,   setGroupBy]   = useState<GroupBy>('epic')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [show,      setShow]      = useState({ epics: true, sprints: true, issues: true, milestones: true })
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const [milestoneModal, setMilestoneModal]   = useState<{ open: boolean; milestone: Milestone | null }>({ open: false, milestone: null })

  const scrollRef = useRef<HTMLDivElement>(null)
  const dw = DAY_WIDTH[zoom]

  // ── View range ────────────────────────────────────────────────────────────
  const { start: viewStart, end: viewEnd } = useMemo(
    () => computeRange(issues, epics, sprints, milestones),
    [issues, epics, sprints, milestones],
  )
  const totalDays  = differenceInDays(viewEnd, viewStart)
  const totalWidth = totalDays * dw

  // ── Header segments ───────────────────────────────────────────────────────
  const topSegs = useMemo(
    () => zoom === 'week' ? weekRangeSegs(viewStart, viewEnd, dw) : monthSegs(viewStart, viewEnd, dw),
    [viewStart, viewEnd, dw, zoom],
  )
  const bottomSegs = useMemo(() => {
    if (zoom === 'month') return dayNumSegs(viewStart, viewEnd, dw)
    if (zoom === 'week')  return dayOfWeekSegs(viewStart, viewEnd, dw)
    return []
  }, [viewStart, viewEnd, dw, zoom])

  const weekendXs = useMemo(
    () => (zoom === 'week' || zoom === 'month') ? weekendCols(viewStart, viewEnd, dw) : [],
    [viewStart, viewEnd, dw, zoom],
  )

  // ── Today position ────────────────────────────────────────────────────────
  const today     = new Date()
  const todayX    = xOf(viewStart, today, dw)
  const todayInView = todayX >= 0 && todayX <= totalWidth

  // ── Rows ──────────────────────────────────────────────────────────────────
  const rows = useMemo(
    () => buildRows(issues, epics, sprints, milestones, groupBy, collapsed, show),
    [issues, epics, sprints, milestones, groupBy, collapsed, show],
  )

  // ── Row Y-center map (for arrow positioning) ──────────────────────────────
  const rowHeight = (row: GanttRow) =>
    row.kind === 'sprint-track' ? SPRINT_TRACK_H
    : (row.kind === 'epic' || row.kind === 'divider') ? GROUP_H
    : ROW_H

  const rowYMap = useMemo(() => {
    const map = new Map<string, number>()
    let y = 0
    rows.forEach(row => {
      const h = rowHeight(row)
      map.set(row.id, y + h / 2)
      y += h
    })
    return map
  }, [rows])

  const totalRowsHeight = useMemo(() =>
    rows.reduce((sum, row) => sum + rowHeight(row), 0),
    [rows],
  )

  // ── Bar X-range map ───────────────────────────────────────────────────────
  const barXMap = useMemo(() => {
    const map = new Map<string, { x1: number; x2: number }>()
    rows.forEach(row => {
      if (row.kind === 'issue') {
        const i = row.issue
        const start = pd(i.startDate); const end = pd(i.dueDate)
        if (!start && !end) return
        const from = start ?? end!; const to = end ?? (start ? addDays(start, 1) : end!)
        const x1 = xOf(viewStart, from, dw)
        map.set(i.id, { x1, x2: x1 + wOf(from, to, dw) })
      } else if (row.kind === 'milestone') {
        const x = xOf(viewStart, parseISO(row.milestone.date), dw)
        map.set(row.milestone.id, { x1: x, x2: x })
      }
    })
    return map
  }, [rows, viewStart, dw])

  // ── Dependency arrows ─────────────────────────────────────────────────────
  interface Arrow { x1: number; y1: number; x2: number; y2: number; color: string }

  const arrows = useMemo<Arrow[]>(() => {
    const result: Arrow[] = []
    rows.forEach(row => {
      if (row.kind !== 'issue') return
      const issue = row.issue
      const issuePos = barXMap.get(issue.id)
      const issueY = rowYMap.get(issue.id)
      if (!issuePos || issueY === undefined) return

      // Parent → child: parent must finish before child starts
      if (issue.parentIssueId) {
        const parentPos = barXMap.get(issue.parentIssueId)
        const parentY = rowYMap.get(issue.parentIssueId)
        if (parentPos && parentY !== undefined) {
          result.push({ x1: LEFT_W + parentPos.x2, y1: parentY, x2: LEFT_W + issuePos.x1, y2: issueY, color: '#8b5cf6' })
        }
      }

      // Milestone ↔ Issue: direction determined by dates
      //   • Issue finishes before/at milestone date  → issue.end → milestone  (issue feeds into milestone)
      //   • Issue starts at/after milestone date      → milestone → issue.start (milestone unblocks issue)
      if (issue.milestoneId) {
        const msRow = rows.find(r => r.kind === 'milestone' && r.id === issue.milestoneId)
        if (msRow && msRow.kind === 'milestone') {
          const msPos = barXMap.get(issue.milestoneId)
          const msY = rowYMap.get(issue.milestoneId)
          if (msPos && msY !== undefined) {
            const msX     = LEFT_W + msPos.x1
            const issX1   = LEFT_W + issuePos.x1
            const issX2   = LEFT_W + issuePos.x2
            const color   = msRow.milestone.color

            if (issX2 <= msX) {
              // issue finishes before milestone → issue feeds INTO milestone
              result.push({ x1: issX2, y1: issueY, x2: msX, y2: msY, color })
            } else {
              // issue starts at/after milestone, or overlaps → milestone unblocks issue
              result.push({ x1: msX, y1: msY, x2: issX1, y2: issueY, color })
            }
          }
        }
      }
    })
    return result
  }, [rows, barXMap, rowYMap])

  const arrowColors = useMemo(() => [...new Set(arrows.map(a => a.color))], [arrows])

  // ── Scroll to today on mount ──────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !todayInView) return
    const targetScrollLeft = LEFT_W + todayX - el.clientWidth / 2
    el.scrollLeft = Math.max(0, targetScrollLeft)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToToday = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const targetScrollLeft = LEFT_W + todayX - el.clientWidth / 2
    el.scrollLeft = Math.max(0, targetScrollLeft)
  }, [todayX])

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // ── Row left-cell renderer ────────────────────────────────────────────────
  function renderLabel(row: GanttRow) {
    if (row.kind === 'milestone') {
      const m = row.milestone
      return (
        <button
          onClick={() => setMilestoneModal({ open: true, milestone: m })}
          className="flex w-full items-center gap-2 px-3 text-start hover:bg-surface-muted"
        >
          <span className="inline-block h-3 w-3 shrink-0 rotate-45 rounded-sm" style={{ backgroundColor: m.color }} />
          <span className="truncate text-xs font-medium text-text-primary">{m.title}</span>
          <span className="ms-auto shrink-0 text-[10px] text-text-muted">{format(parseISO(m.date), 'MMM d')}</span>
        </button>
      )
    }

    if (row.kind === 'epic') {
      const e = row.epic
      const isCollapsible = groupBy === 'epic'
      return (
        <button
          onClick={() => isCollapsible && toggleCollapse(e.id)}
          className="flex w-full items-center gap-1.5 px-3 text-start hover:bg-surface-muted"
        >
          {isCollapsible
            ? (row.collapsed
                ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                : <ChevronDown  className="h-3.5 w-3.5 shrink-0 text-text-muted" />)
            : <span className="h-3.5 w-3.5 shrink-0" />}
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
          <span className="truncate text-xs font-semibold text-text-primary">{e.title}</span>
        </button>
      )
    }

    if (row.kind === 'sprint-track') {
      return (
        <div className="flex w-full items-center gap-1.5 px-3">
          <Layers className="h-3 w-3 shrink-0 text-text-muted" />
          <span className="text-xs font-semibold text-text-muted">Sprints</span>
          <span className="ms-1 text-[10px] text-text-muted opacity-60">{row.sprints.length}</span>
        </div>
      )
    }

    if (row.kind === 'issue') {
      const i = row.issue
      return (
        <button
          onClick={() => setSelectedIssueId(i.id)}
          className="flex w-full items-center gap-1.5 text-start hover:bg-surface-muted"
          style={{ paddingLeft: `${12 + row.indent * 20}px`, paddingRight: '12px' }}
        >
          <IssueTypeIcon type={i.type} />
          <span className="shrink-0 font-mono text-[10px] text-text-muted">{i.issueKey}</span>
          <span className="truncate text-xs text-text-primary">{i.title}</span>
        </button>
      )
    }

    if (row.kind === 'divider') {
      return (
        <button
          onClick={() => toggleCollapse(row.id)}
          className="flex w-full items-center gap-1.5 px-3 text-start hover:bg-surface-muted"
        >
          {row.collapsed
            ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-muted" />
            : <ChevronDown  className="h-3.5 w-3.5 shrink-0 text-text-muted" />}
          <span className="text-xs font-medium text-text-muted">{row.label}</span>
        </button>
      )
    }
  }

  // ── Row bar renderer ──────────────────────────────────────────────────────
  function renderBar(row: GanttRow) {
    if (row.kind === 'milestone') {
      const m   = row.milestone
      const mX  = xOf(viewStart, parseISO(m.date), dw)
      if (mX < -20 || mX > totalWidth + 20) return null
      return (
        <button
          onClick={() => setMilestoneModal({ open: true, milestone: m })}
          className={cn('absolute top-1/2 -translate-x-1/2 -translate-y-1/2 group', milestoneStatusClass(m.status))}
          style={{ left: mX }}
          title={`${m.title} — ${format(parseISO(m.date), 'MMM d, yyyy')}`}
        >
          {/* Diamond shape */}
          <span
            className="block h-4 w-4 rotate-45 rounded-sm border-2 border-white shadow-md transition-transform group-hover:scale-125"
            style={{ backgroundColor: m.color }}
          />
          {/* Label below */}
          <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-surface px-1 text-[10px] font-medium text-text-primary opacity-0 shadow group-hover:opacity-100 border border-surface-border">
            {m.title}
          </span>
        </button>
      )
    }

    if (row.kind === 'epic') {
      const e      = row.epic
      const start  = pd(e.startDate)
      const end    = pd(e.endDate)
      if (!start && !end) return <span className="absolute inset-0 flex items-center ps-2 text-[10px] italic text-text-muted">No dates</span>
      const s = start ?? end!
      const f = end   ?? start!
      const left  = xOf(viewStart, s, dw)
      const width = wOf(s, f, dw)
      return (
        <div
          className="absolute top-1/2 flex h-6 -translate-y-1/2 cursor-pointer items-center overflow-hidden rounded-md opacity-90 hover:opacity-100 transition-opacity"
          style={{ left, width, backgroundColor: e.color + '40', border: `2px solid ${e.color}` }}
          title={e.title}
        >
          <span className="truncate px-2 text-[11px] font-semibold" style={{ color: e.color }}>
            {e.title}
          </span>
        </div>
      )
    }

    if (row.kind === 'sprint-track') {
      return (
        <>
          {row.sprints.map(s => {
            const start = pd(s.startDate)
            const end   = pd(s.endDate)
            if (!start && !end) return null
            const from  = start ?? end!
            const to    = end   ?? start!
            const left  = xOf(viewStart, from, dw)
            const width = wOf(from, to, dw)
            if (left > totalWidth || left + width < 0) return null
            const progress = s.totalIssues > 0 ? (s.completedIssues / s.totalIssues) * 100 : 0
            const statusColor = s.status === 'ACTIVE'
              ? 'var(--color-primary)'
              : s.status === 'COMPLETED'
                ? 'var(--color-text-muted)'
                : 'var(--color-primary)'
            return (
              <div
                key={s.id}
                className="absolute top-1/2 flex h-6 -translate-y-1/2 cursor-default items-center overflow-hidden rounded-full"
                style={{
                  left,
                  width: Math.max(width, 4),
                  backgroundColor: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
                  border: `1.5px solid color-mix(in srgb, ${statusColor} 40%, transparent)`,
                }}
                title={`${s.name}${s.totalIssues > 0 ? ` — ${s.completedIssues}/${s.totalIssues} done` : ''}`}
              >
                {progress > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${progress}%`, backgroundColor: `color-mix(in srgb, ${statusColor} 35%, transparent)` }}
                  />
                )}
                <span
                  className="relative truncate px-2.5 text-[11px] font-semibold"
                  style={{ color: statusColor }}
                >
                  {s.name}
                </span>
              </div>
            )
          })}
        </>
      )
    }

    if (row.kind === 'issue') {
      const i      = row.issue
      const start  = pd(i.startDate)
      const end    = pd(i.dueDate)
      if (!start && !end) return null
      const from = start ?? end!
      const to   = end   ?? (start ? addDays(start, 1) : end!)
      const left  = xOf(viewStart, from, dw)
      const width = wOf(from, to, dw)
      const barColor = PRIORITY_COLORS[i.priority] ?? '#6b7280'
      return (
        <button
          onClick={() => setSelectedIssueId(i.id)}
          className="absolute top-1/2 flex h-5 -translate-y-1/2 cursor-pointer items-center overflow-hidden rounded transition-opacity hover:opacity-80"
          style={{ left, width: Math.max(width, 6), backgroundColor: barColor + '30', border: `1.5px solid ${barColor}` }}
          title={`${i.issueKey}: ${i.title}`}
        >
          <span className="truncate px-1.5 text-[10px] font-medium" style={{ color: barColor }}>
            {width > 60 ? i.issueKey : ''}
          </span>
        </button>
      )
    }

    return null
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-surface-border px-4 py-2.5">
        {/* Group by */}
        <div className="flex items-center gap-1 rounded-lg border border-surface-border text-xs font-medium">
          {(['epic', 'sprint', 'none'] as GroupBy[]).map((g, i, arr) => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={cn(
                'px-3 py-1.5 capitalize',
                i === 0 ? 'rounded-s-md' : i === arr.length - 1 ? 'rounded-e-md' : '',
                groupBy === g ? 'bg-primary-subtle text-primary' : 'text-text-secondary hover:bg-surface-muted',
              )}
            >
              {g === 'none' ? 'Flat' : g === 'epic' ? 'By Epic' : 'By Sprint'}
            </button>
          ))}
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 rounded-lg border border-surface-border text-xs font-medium">
          {(['week', 'month', 'quarter', 'year'] as Zoom[]).map((z, i, arr) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={cn(
                'px-3 py-1.5 capitalize',
                i === 0 ? 'rounded-s-md' : i === arr.length - 1 ? 'rounded-e-md' : '',
                zoom === z ? 'bg-primary-subtle text-primary' : 'text-text-secondary hover:bg-surface-muted',
              )}
            >
              {z.charAt(0).toUpperCase() + z.slice(1)}
            </button>
          ))}
        </div>

        {/* Show toggles */}
        <div className="flex items-center gap-1">
          {(['epics', 'sprints', 'issues', 'milestones'] as const).map(key => (
            <button
              key={key}
              onClick={() => setShow(prev => ({ ...prev, [key]: !prev[key] }))}
              className={cn(
                'rounded-md border border-surface-border px-2.5 py-1.5 text-xs font-medium capitalize transition-colors',
                show[key]
                  ? 'border-primary/40 bg-primary-subtle text-primary'
                  : 'text-text-muted hover:bg-surface-muted',
              )}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="ms-auto flex items-center gap-2">
          {/* Today */}
          <button
            onClick={scrollToToday}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Today
          </button>

          {/* Add milestone */}
          <button
            onClick={() => setMilestoneModal({ open: true, milestone: null })}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
          >
            <Plus className="h-3.5 w-3.5" />
            Milestone
          </button>
        </div>
      </div>

      {/* Gantt — always LTR (time goes left-to-right) */}
      <div className="relative min-h-0 flex-1 overflow-auto" ref={scrollRef} dir="ltr">
        {/* ── Sticky date header ────────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-20 flex"
          style={{ height: HEADER_H, minWidth: LEFT_W + totalWidth }}
        >
          {/* Corner cell */}
          <div
            className="sticky left-0 z-30 flex shrink-0 items-end border-e border-b border-surface-border bg-surface px-3 pb-1.5"
            style={{ width: LEFT_W }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Name</span>
          </div>

          {/* Date area */}
          <div className="relative flex-1 border-b border-surface-border bg-surface" style={{ minWidth: totalWidth }}>
            {/* Weekend column shading in header */}
            {weekendXs.map((x, wi) => (
              <div key={wi} className="absolute top-0 bottom-0 bg-surface-muted/40" style={{ left: x, width: dw }} />
            ))}

            {/* Top row — months or week ranges */}
            <div className="absolute inset-x-0 top-0" style={{ height: HEADER_H / 2 }}>
              {topSegs.map((seg, i) => (
                <div
                  key={i}
                  className="absolute flex items-center border-e border-surface-border/60 px-2"
                  style={{ left: seg.left, width: seg.width, height: HEADER_H / 2 }}
                >
                  <span className="text-[11px] font-semibold text-text-secondary">{seg.label}</span>
                </div>
              ))}
            </div>

            {/* Bottom row — day numbers (month) or day-of-week (week) */}
            <div className="absolute inset-x-0 border-t border-surface-border/40" style={{ top: HEADER_H / 2, height: HEADER_H / 2 }}>
              {bottomSegs.map((seg, i) => (
                <div
                  key={i}
                  className={cn(
                    'absolute flex items-center justify-center border-e border-surface-border/30',
                    seg.isWeekend && 'bg-surface-muted/60',
                  )}
                  style={{ left: seg.left, width: seg.width, height: HEADER_H / 2 }}
                >
                  <span className={cn('text-[10px]', seg.isWeekend ? 'text-text-muted' : 'text-text-secondary')}>
                    {seg.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Today marker in header */}
            {todayInView && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500/70"
                style={{ left: todayX }}
              />
            )}
          </div>
        </div>

        {/* ── Rows ─────────────────────────────────────────────────────────── */}
        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-sm text-text-muted">
            No items to display. Add dates to your epics, sprints, or issues.
          </div>
        ) : (
          <div className="relative" style={{ minWidth: LEFT_W + totalWidth }}>
            {rows.map(row => {
              const rowH = rowHeight(row)
              return (
                <div
                  key={row.id}
                  className={cn(
                    'flex border-b border-surface-border/60',
                    row.kind === 'epic'          && 'bg-surface-muted/30',
                    row.kind === 'sprint-track'  && 'bg-primary/[0.03]',
                    row.kind === 'divider'       && 'bg-surface-muted/50',
                  )}
                  style={{ height: rowH, minWidth: LEFT_W + totalWidth }}
                >
                  {/* Left label — sticky */}
                  <div
                    className="sticky left-0 z-10 flex shrink-0 items-center border-e border-surface-border/60 bg-inherit"
                    style={{ width: LEFT_W, height: rowH }}
                  >
                    {renderLabel(row)}
                  </div>

                  {/* Timeline area */}
                  <div className="relative" style={{ width: totalWidth, height: rowH }}>
                    {/* Weekend column shading (week & month zoom) */}
                    {weekendXs.map((x, wi) => (
                      <div
                        key={wi}
                        className="absolute top-0 bottom-0 bg-surface-muted/40"
                        style={{ left: x, width: dw }}
                      />
                    ))}

                    {/* Vertical grid lines (top-row segment boundaries) */}
                    {topSegs.map((seg, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-e border-surface-border/30"
                        style={{ left: seg.left + seg.width - 1 }}
                      />
                    ))}

                    {/* Today line */}
                    {todayInView && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500/25"
                        style={{ left: todayX }}
                      />
                    )}

                    {/* The bar / marker for this row */}
                    {renderBar(row)}
                  </div>
                </div>
              )
            })}

            {/* ── SVG dependency arrows overlay ───────────────────────────── */}
            {arrows.length > 0 && (
              <svg
                className="pointer-events-none absolute left-0 top-0"
                width={LEFT_W + totalWidth}
                height={totalRowsHeight}
                style={{ overflow: 'visible' }}
              >
                <defs>
                  {arrowColors.map(color => (
                    <marker
                      key={color}
                      id={`ah-${color.replace('#', '')}`}
                      markerWidth="8" markerHeight="8"
                      refX="7" refY="3.5" orient="auto"
                    >
                      <path d="M 0 0 L 7 3.5 L 0 7 z" fill={color} opacity="0.85" />
                    </marker>
                  ))}
                </defs>
                {arrows.map((a, i) => {
                  const sdx    = a.x2 - a.x1   // signed dx
                  const adx    = Math.abs(sdx)
                  const cpOff  = Math.max(adx * 0.45, 40)
                  // For backward arrows (right → left) bow the path downward so it
                  // doesn't cut through bars; for forward arrows use a classic S-curve.
                  const pathD = sdx >= 0
                    ? `M ${a.x1},${a.y1} C ${a.x1 + cpOff},${a.y1} ${a.x2 - cpOff},${a.y2} ${a.x2},${a.y2}`
                    : (() => {
                        const bow = Math.min(Math.abs(a.y2 - a.y1) * 0.35 + 18, 32)
                        return `M ${a.x1},${a.y1} C ${a.x1},${a.y1 + bow} ${a.x2},${a.y2 + bow} ${a.x2},${a.y2}`
                      })()
                  return (
                    <path
                      key={i}
                      d={pathD}
                      stroke={a.color}
                      strokeWidth="2"
                      strokeOpacity="0.75"
                      fill="none"
                      strokeLinecap="round"
                      markerEnd={`url(#ah-${a.color.replace('#', '')})`}
                    />
                  )
                })}
              </svg>
            )}
          </div>
        )}

        {/* Bottom padding row */}
        <div style={{ height: 40, minWidth: LEFT_W + totalWidth }} />
      </div>

      {/* Issue detail panel */}
      {selectedIssueId && (
        <IssueDetailPanel
          issueId={selectedIssueId}
          boardId={boardId}
          columns={columns}
          onClose={() => setSelectedIssueId(null)}
        />
      )}

      {/* Milestone modal */}
      {milestoneModal.open && (
        <MilestoneModal
          boardId={boardId}
          milestone={milestoneModal.milestone}
          onClose={() => setMilestoneModal({ open: false, milestone: null })}
        />
      )}
    </div>
  )
}
