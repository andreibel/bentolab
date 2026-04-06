import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import {
  ChevronRight, ChevronDown, CalendarDays, Layers, ExternalLink,
} from 'lucide-react'
import {
  format, parseISO, differenceInDays, addDays, addMonths,
  startOfMonth, endOfMonth, startOfWeek, isValid,
} from 'date-fns'
import { useBoards } from '@/api/boards'
import { epicsApi } from '@/api/epics'
import { sprintsApi } from '@/api/sprints'
import { milestonesApi } from '@/api/milestones'
import { queryKeys } from '@/api/queryKeys'
import { cn } from '@/utils/cn'
import type { Board } from '@/types/board'
import type { Epic } from '@/types/epic'
import type { Sprint } from '@/types/sprint'
import type { Milestone } from '@/types/milestone'

// ── Types & constants ──────────────────────────────────────────────────────────

type Zoom    = 'week' | 'month' | 'quarter' | 'year'

const DAY_WIDTH: Record<Zoom, number> = { week: 56, month: 30, quarter: 13, year: 5 }
const LEFT_W   = 280
const ROW_H    = 40
const GROUP_H  = 44
const HEADER_H = 54

const BOARD_COLORS = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b',
  '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4',
]

type GlobalRow =
  | { kind: 'milestone';    id: string; milestone: Milestone; boardName: string; boardColor: string }
  | { kind: 'board-header'; id: string; board: Board;         collapsed: boolean; boardColor: string }
  | { kind: 'epic';         id: string; epic: Epic }
  | { kind: 'sprint';       id: string; sprint: Sprint }

// ── Date utilities (self-contained) ───────────────────────────────────────────

function pd(s: string | null | undefined): Date | null {
  if (!s) return null
  const d = parseISO(s)
  return isValid(d) ? d : null
}
function xOf(viewStart: Date, date: Date, dw: number) { return differenceInDays(date, viewStart) * dw }
function wOf(s: Date, e: Date, dw: number)             { return Math.max(differenceInDays(e, s) + 1, 1) * dw }

// ── Header generators ──────────────────────────────────────────────────────────

interface Seg { label: string; left: number; width: number; isWeekend?: boolean }

function monthSegs(vs: Date, ve: Date, dw: number): Seg[] {
  const out: Seg[] = []
  let cur = startOfMonth(vs)
  while (cur <= ve) {
    const mEnd = endOfMonth(cur)
    const from = cur < vs ? vs : cur
    const to   = mEnd > ve ? ve : mEnd
    out.push({ label: format(cur, 'MMM yyyy'), left: Math.max(0, differenceInDays(from, vs)) * dw, width: (differenceInDays(to, from) + 1) * dw })
    cur = addMonths(cur, 1)
  }
  return out
}

function weekRangeSegs(vs: Date, ve: Date, dw: number): Seg[] {
  const out: Seg[] = []
  let w = startOfWeek(vs, { weekStartsOn: 1 })
  while (w <= ve) {
    const from  = w < vs ? vs : w
    const wEnd  = addDays(w, 6)
    const to    = wEnd > ve ? ve : wEnd
    out.push({ label: format(w, 'MMM d') + ' – ' + format(wEnd, 'd'), left: Math.max(0, differenceInDays(from, vs)) * dw, width: (differenceInDays(to, from) + 1) * dw })
    w = addDays(w, 7)
  }
  return out
}

function dayNumSegs(vs: Date, ve: Date, dw: number): Seg[] {
  const out: Seg[] = []
  let d = new Date(vs)
  while (d <= ve) {
    const dow = d.getDay()
    out.push({ label: format(d, 'd'), left: differenceInDays(d, vs) * dw, width: dw, isWeekend: dow === 0 || dow === 6 })
    d = addDays(d, 1)
  }
  return out
}

function dayOfWeekSegs(vs: Date, ve: Date, dw: number): Seg[] {
  const out: Seg[] = []
  let d = new Date(vs)
  while (d <= ve) {
    const dow = d.getDay()
    out.push({ label: format(d, 'EEE d'), left: differenceInDays(d, vs) * dw, width: dw, isWeekend: dow === 0 || dow === 6 })
    d = addDays(d, 1)
  }
  return out
}

function weekendCols(vs: Date, ve: Date, dw: number): number[] {
  const xs: number[] = []
  let d = new Date(vs)
  while (d <= ve) {
    const dow = d.getDay()
    if (dow === 0 || dow === 6) xs.push(differenceInDays(d, vs) * dw)
    d = addDays(d, 1)
  }
  return xs
}

// ── View range ─────────────────────────────────────────────────────────────────

function computeRange(
  allEpics: Epic[][], allSprints: Sprint[][], allMilestones: Milestone[][],
): { start: Date; end: Date } {
  const ts: number[] = []
  allEpics.flat().forEach(e => {
    if (e.startDate) ts.push(parseISO(e.startDate).getTime())
    if (e.endDate)   ts.push(parseISO(e.endDate).getTime())
  })
  allSprints.flat().forEach(s => {
    if (s.startDate) ts.push(parseISO(s.startDate).getTime())
    if (s.endDate)   ts.push(parseISO(s.endDate).getTime())
  })
  allMilestones.flat().forEach(m => ts.push(parseISO(m.date).getTime()))

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
  boards: Board[],
  boardColors: string[],
  epicsMap: Map<string, Epic[]>,
  sprintsMap: Map<string, Sprint[]>,
  milestonesMap: Map<string, Milestone[]>,
  collapsed: Set<string>,
  show: { epics: boolean; sprints: boolean; milestones: boolean },
): GlobalRow[] {
  const rows: GlobalRow[] = []

  // All milestones at the top, sorted by date
  if (show.milestones) {
    boards.forEach((b, bi) => {
      const ms = milestonesMap.get(b.id) ?? []
      ;[...ms]
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach(m => rows.push({ kind: 'milestone', id: m.id, milestone: m, boardName: b.name, boardColor: boardColors[bi] }))
    })
  }

  // Board sections
  boards.forEach((board, bi) => {
    const color       = boardColors[bi]
    const isCollapsed = collapsed.has(board.id)

    rows.push({ kind: 'board-header', id: board.id, board, collapsed: isCollapsed, boardColor: color })

    if (!isCollapsed) {
      if (show.epics) {
        ;[...(epicsMap.get(board.id) ?? [])]
          .filter(e => e.startDate || e.endDate)
          .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
          .forEach(e => rows.push({ kind: 'epic', id: e.id, epic: e }))
      }
      if (show.sprints) {
        ;[...(sprintsMap.get(board.id) ?? [])]
          .filter(s => s.status !== 'COMPLETED')
          .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
          .forEach(s => rows.push({ kind: 'sprint', id: s.id, sprint: s }))
      }
    }
  })

  return rows
}

// ── Board type badge ────────────────────────────────────────────────────────────

function BoardTypeBadge({ boardType }: { boardType: Board['boardType'] }) {
  const labels: Record<Board['boardType'], string> = {
    SCRUM:        'Scrum',
    KANBAN:       'Kanban',
    BUG_TRACKING: 'Bugs',
    CUSTOM:       'Custom',
  }
  return (
    <span className="rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-surface-muted text-text-muted">
      {labels[boardType]}
    </span>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function GlobalTimelinePage() {
  const navigate = useNavigate()

  const { data: boardsData } = useBoards()
  const boards = boardsData ?? []

  // Assign stable colors per board (index-based)
  const boardColors = useMemo(
    () => boards.map((_, i) => BOARD_COLORS[i % BOARD_COLORS.length]),
    [boards],
  )

  // Parallel fetch epics, sprints, milestones for every board
  const epicResults = useQueries({
    queries: boards.map(b => ({
      queryKey: queryKeys.epics.list(b.id),
      queryFn:  () => epicsApi.list(b.id),
      enabled:  !!b.id,
    })),
  })
  const sprintResults = useQueries({
    queries: boards.map(b => ({
      queryKey: queryKeys.sprints.all(b.id),
      queryFn:  () => sprintsApi.list(b.id),
      enabled:  !!b.id,
    })),
  })
  const milestoneResults = useQueries({
    queries: boards.map(b => ({
      queryKey: queryKeys.milestones.list(b.id),
      queryFn:  () => milestonesApi.list(b.id),
      enabled:  !!b.id,
    })),
  })

  // Build maps boardId → items[]
  const epicsMap = useMemo(() => {
    const m = new Map<string, Epic[]>()
    boards.forEach((b, i) => m.set(b.id, epicResults[i]?.data ?? []))
    return m
  }, [boards, epicResults])

  const sprintsMap = useMemo(() => {
    const m = new Map<string, Sprint[]>()
    boards.forEach((b, i) => m.set(b.id, sprintResults[i]?.data ?? []))
    return m
  }, [boards, sprintResults])

  const milestonesMap = useMemo(() => {
    const m = new Map<string, Milestone[]>()
    boards.forEach((b, i) => m.set(b.id, milestoneResults[i]?.data ?? []))
    return m
  }, [boards, milestoneResults])

  const isLoading = boards.length === 0 || epicResults.some(r => r.isLoading)

  // ── UI state ────────────────────────────────────────────────────────────
  const [zoom,      setZoom]      = useState<Zoom>('month')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [show,      setShow]      = useState({ epics: true, sprints: true, milestones: true })

  const scrollRef = useRef<HTMLDivElement>(null)
  const dw = DAY_WIDTH[zoom]

  // ── View range ───────────────────────────────────────────────────────────
  const { start: viewStart, end: viewEnd } = useMemo(
    () => computeRange(
      boards.map(b => epicsMap.get(b.id) ?? []),
      boards.map(b => sprintsMap.get(b.id) ?? []),
      boards.map(b => milestonesMap.get(b.id) ?? []),
    ),
    [boards, epicsMap, sprintsMap, milestonesMap],
  )

  const totalDays  = differenceInDays(viewEnd, viewStart)
  const totalWidth = totalDays * dw

  // ── Header segments ──────────────────────────────────────────────────────
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

  // ── Today ────────────────────────────────────────────────────────────────
  const today       = new Date()
  const todayX      = xOf(viewStart, today, dw)
  const todayInView = todayX >= 0 && todayX <= totalWidth

  // ── Rows ──────────────────────────────────────────────────────────────────
  const rows = useMemo(
    () => buildRows(boards, boardColors, epicsMap, sprintsMap, milestonesMap, collapsed, show),
    [boards, boardColors, epicsMap, sprintsMap, milestonesMap, collapsed, show],
  )

  // ── Scroll to today on mount ──────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !todayInView) return
    el.scrollLeft = Math.max(0, LEFT_W + todayX - el.clientWidth / 2)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToToday = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollLeft = Math.max(0, LEFT_W + todayX - el.clientWidth / 2)
  }, [todayX])

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // ── Left label renderer ──────────────────────────────────────────────────
  function renderLabel(row: GlobalRow) {
    if (row.kind === 'milestone') {
      const m = row.milestone
      return (
        <div className="flex w-full items-center gap-2 px-3">
          <span className="inline-block h-3 w-3 shrink-0 rotate-45 rounded-sm" style={{ backgroundColor: m.color }} />
          <span className="truncate text-xs font-medium text-text-primary">{m.title}</span>
          <span
            className="ms-auto shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold"
            style={{ backgroundColor: row.boardColor + '22', color: row.boardColor }}
          >
            {row.boardName}
          </span>
        </div>
      )
    }

    if (row.kind === 'board-header') {
      const b = row.board
      return (
        <button
          onClick={() => toggleCollapse(b.id)}
          className="flex w-full items-center gap-2 px-3 text-start hover:bg-surface-muted"
        >
          {row.collapsed
            ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-muted" />
            : <ChevronDown  className="h-3.5 w-3.5 shrink-0 text-text-muted" />}
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: row.boardColor }} />
          <span className="truncate text-xs font-semibold text-text-primary">{b.name}</span>
          <BoardTypeBadge boardType={b.boardType} />
          <button
            onClick={e => { e.stopPropagation(); navigate(`/boards/${b.id}`) }}
            className="ms-auto shrink-0 rounded p-0.5 text-text-muted opacity-0 hover:text-text-primary group-hover:opacity-100"
            title="Open board"
          >
            <ExternalLink className="h-3 w-3" />
          </button>
        </button>
      )
    }

    if (row.kind === 'epic') {
      const e = row.epic
      return (
        <div className="flex w-full items-center gap-1.5 ps-8 pe-3">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
          <span className="truncate text-xs text-text-primary">{e.title}</span>
        </div>
      )
    }

    if (row.kind === 'sprint') {
      const s = row.sprint
      const statusColor = s.status === 'ACTIVE' ? 'text-emerald-500' : 'text-primary'
      return (
        <div className="flex w-full items-center gap-1.5 ps-8 pe-3">
          <Layers className={cn('h-3 w-3 shrink-0', statusColor)} />
          <span className="truncate text-xs text-text-primary">{s.name}</span>
        </div>
      )
    }
  }

  // ── Bar renderer ─────────────────────────────────────────────────────────
  function renderBar(row: GlobalRow) {
    if (row.kind === 'milestone') {
      const m  = row.milestone
      const mX = xOf(viewStart, parseISO(m.date), dw)
      if (mX < -20 || mX > totalWidth + 20) return null
      const dimmed = m.status === 'REACHED' ? 'opacity-60' : m.status === 'MISSED' ? 'opacity-30 grayscale' : ''
      return (
        <div
          className={cn('absolute top-1/2 -translate-x-1/2 -translate-y-1/2 group cursor-default', dimmed)}
          style={{ left: mX }}
          title={`${m.title} — ${format(parseISO(m.date), 'MMM d, yyyy')} · ${row.boardName}`}
        >
          <span
            className="block h-4 w-4 rotate-45 rounded-sm border-2 border-white shadow-md transition-transform group-hover:scale-125"
            style={{ backgroundColor: m.color }}
          />
          <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-surface-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text-primary opacity-0 shadow-lg group-hover:opacity-100">
            {m.title}
          </span>
        </div>
      )
    }

    if (row.kind === 'board-header') {
      if (!todayInView) return null
      return (
        <div
          className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-red-500/10 px-1.5 text-[10px] font-semibold text-red-500"
          style={{ left: todayX + 4 }}
        >
          today
        </div>
      )
    }

    if (row.kind === 'epic') {
      const e     = row.epic
      const start = pd(e.startDate)
      const end   = pd(e.endDate)
      if (!start && !end) return null
      const from  = start ?? end!
      const to    = end   ?? start!
      const left  = xOf(viewStart, from, dw)
      const width = wOf(from, to, dw)
      return (
        <div
          className="absolute top-1/2 flex h-6 -translate-y-1/2 cursor-pointer items-center overflow-hidden rounded-md opacity-90 transition-opacity hover:opacity-100"
          style={{ left, width, backgroundColor: e.color + '40', border: `2px solid ${e.color}` }}
          title={e.title}
        >
          <span className="truncate px-2 text-[11px] font-semibold" style={{ color: e.color }}>
            {width > 50 ? e.title : ''}
          </span>
        </div>
      )
    }

    if (row.kind === 'sprint') {
      const s     = row.sprint
      const start = pd(s.startDate)
      const end   = pd(s.endDate)
      if (!start && !end) return null
      const from     = start ?? end!
      const to       = end   ?? start!
      const left     = xOf(viewStart, from, dw)
      const width    = wOf(from, to, dw)
      const progress = s.totalIssues > 0 ? (s.completedIssues / s.totalIssues) * 100 : 0
      return (
        <div
          className="absolute top-1/2 flex h-7 -translate-y-1/2 cursor-default items-center overflow-hidden rounded-full"
          style={{ left, width, backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }}
          title={s.name}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{ width: `${progress}%`, backgroundColor: 'color-mix(in srgb, var(--color-primary) 35%, transparent)' }}
          />
          <span className="relative truncate px-3 text-[11px] font-semibold text-primary">
            {width > 60 ? s.name : ''}
          </span>
        </div>
      )
    }

    return null
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (!isLoading && boards.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-muted">
        No boards found. Create a board to see it on the timeline.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-surface-border px-4 py-2.5">
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
          {(['epics', 'sprints', 'milestones'] as const).map(key => (
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

        {/* Board count */}
        <span className="text-xs text-text-muted">
          {boards.length} board{boards.length !== 1 ? 's' : ''}
        </span>

        <div className="ms-auto flex items-center gap-2">
          <button
            onClick={scrollToToday}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Today
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
          Loading timeline…
        </div>
      ) : (
        /* Gantt — always LTR */
        <div className="relative min-h-0 flex-1 overflow-auto" ref={scrollRef} dir="ltr">
          {/* Sticky header */}
          <div className="sticky top-0 z-20 flex" style={{ height: HEADER_H, minWidth: LEFT_W + totalWidth }}>
            <div
              className="sticky left-0 z-30 flex shrink-0 items-end border-e border-b border-surface-border bg-surface px-3 pb-1.5"
              style={{ width: LEFT_W }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Board / Item</span>
            </div>
            <div className="relative flex-1 border-b border-surface-border bg-surface" style={{ minWidth: totalWidth }}>
              {weekendXs.map((x, i) => (
                <div key={i} className="absolute top-0 bottom-0 bg-surface-muted/40" style={{ left: x, width: dw }} />
              ))}
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
              {todayInView && (
                <div className="absolute top-0 bottom-0 w-0.5 bg-red-500/70" style={{ left: todayX }} />
              )}
            </div>
          </div>

          {/* Rows */}
          {rows.length === 0 ? (
            <div className="flex items-center justify-center py-24 text-sm text-text-muted">
              No items to display. Add dates to your epics, sprints, or milestones.
            </div>
          ) : rows.map(row => {
            const isGroup = row.kind === 'board-header'
            const rowH    = isGroup ? GROUP_H : ROW_H
            return (
              <div
                key={row.id}
                className={cn(
                  'group flex border-b border-surface-border/60',
                  row.kind === 'board-header' && 'bg-surface-muted/40',
                )}
                style={{ height: rowH, minWidth: LEFT_W + totalWidth }}
              >
                {/* Left label */}
                <div
                  className="sticky left-0 z-10 flex shrink-0 items-center border-e border-surface-border/60 bg-inherit"
                  style={{ width: LEFT_W, height: rowH }}
                >
                  {renderLabel(row)}
                </div>

                {/* Timeline area */}
                <div className="relative" style={{ width: totalWidth, height: rowH }}>
                  {weekendXs.map((x, i) => (
                    <div key={i} className="absolute top-0 bottom-0 bg-surface-muted/40" style={{ left: x, width: dw }} />
                  ))}
                  {topSegs.map((seg, i) => (
                    <div key={i} className="absolute top-0 bottom-0 border-e border-surface-border/30" style={{ left: seg.left + seg.width - 1 }} />
                  ))}
                  {todayInView && (
                    <div className="absolute top-0 bottom-0 w-0.5 bg-red-500/25" style={{ left: todayX }} />
                  )}
                  {renderBar(row)}
                </div>
              </div>
            )
          })}

          <div style={{ height: 40, minWidth: LEFT_W + totalWidth }} />
        </div>
      )}
    </div>
  )
}
