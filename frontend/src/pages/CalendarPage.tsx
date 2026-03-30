import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useQuery} from '@tanstack/react-query'
import Fuse from 'fuse.js'
import {CalendarDays, ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, Search, X} from 'lucide-react'
import {issuesApi} from '@/api/issues'
import {useBoards} from '@/api/boards'
import {queryKeys} from '@/api/queryKeys'
import {useAuthStore} from '@/stores/authStore'
import {IssueDetailPanel} from '@/components/issues/IssueDetailPanel'
import {cn} from '@/utils/cn'
import type {Issue, IssuePriority} from '@/types/issue'
import type {Board} from '@/types/board'

// ── Constants ─────────────────────────────────────────────────────────────────

type Relation = 'all' | 'assigned' | 'created'
type ViewMode  = 'month' | 'week'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

/** Border color for the left accent stripe on each chip */
const PRIORITY_COLOR: Record<IssuePriority, string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#eab308',
  LOW:      '#60a5fa',
}

/** Subtle background tint — visible in both light and dark mode */
const PRIORITY_BG: Record<IssuePriority, string> = {
  CRITICAL: 'rgba(239,68,68,0.10)',
  HIGH:     'rgba(249,115,22,0.10)',
  MEDIUM:   'rgba(234,179,8,0.10)',
  LOW:      'rgba(96,165,250,0.10)',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toYMD(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function isoToYMD(iso: string) { return iso.split('T')[0] }

/** Sunday of the week containing `date` */
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function weekRangeTitle(ws: Date): string {
  const we = new Date(ws)
  we.setDate(we.getDate() + 6)
  const sm = MONTH_NAMES[ws.getMonth()].slice(0, 3)
  const em = MONTH_NAMES[we.getMonth()].slice(0, 3)
  if (ws.getMonth() === we.getMonth())
    return `${sm} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`
  if (ws.getFullYear() === we.getFullYear())
    return `${sm} ${ws.getDate()} – ${em} ${we.getDate()}, ${we.getFullYear()}`
  return `${sm} ${ws.getDate()}, ${ws.getFullYear()} – ${em} ${we.getDate()}, ${we.getFullYear()}`
}

// ── Board filter ──────────────────────────────────────────────────────────────

function BoardFilter({
  boards, value, onChange,
}: {
  boards: Board[]; value: string | null; onChange: (id: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ]       = useState('')
  const ref             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const fuse    = useMemo(() => new Fuse(boards, { keys: ['name','boardKey'], threshold: 0.4 }), [boards])
  const results = q.trim() ? fuse.search(q).map(r => r.item) : boards
  const selected = boards.find(b => b.id === value)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-colors',
          value
            ? 'border-primary/40 bg-primary/5 text-primary'
            : 'border-surface-border text-text-secondary hover:border-primary/30 hover:text-text-primary',
        )}
      >
        {selected ? (
          <>
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: selected.background ?? '#6B7280' }} />
            <span className="max-w-25 truncate">{selected.name}</span>
            <X className="h-3 w-3 opacity-60" onClick={e => { e.stopPropagation(); onChange(null) }} />
          </>
        ) : (
          <> Board <ChevronDown className="h-3 w-3 opacity-60" /> </>
        )}
      </button>
      {open && (
        <div className="absolute inset-s-0 top-full z-50 mt-1 w-52 rounded-xl border border-surface-border bg-surface shadow-xl">
          <div className="p-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-muted px-2 py-1.5">
              <Search className="h-3 w-3 shrink-0 text-text-muted" />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
                className="flex-1 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-muted" />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto pb-2">
            {results.map(b => (
              <button key={b.id} onClick={() => { onChange(b.id); setOpen(false); setQ('') }}
                className={cn('flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-surface-muted', value === b.id && 'text-primary')}>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: b.background ?? '#6B7280' }} />
                <span className="flex-1 truncate text-start">{b.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Issue chip ────────────────────────────────────────────────────────────────

function IssueChip({
  issue, onClick, full = false,
}: {
  issue: Issue; onClick: () => void; full?: boolean
}) {
  const color = PRIORITY_COLOR[issue.priority]
  const bg    = PRIORITY_BG[issue.priority]

  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      style={{ borderLeftColor: color, backgroundColor: bg }}
      className={cn(
        'w-full rounded border-l-[3px] text-left transition-colors hover:brightness-95 dark:hover:brightness-125',
        full ? 'flex flex-col gap-0.5 px-2 py-1.5' : 'flex items-center px-1.5 py-0.5',
        issue.closed && 'opacity-50',
      )}
    >
      {full && (
        <span className="font-mono text-[10px] text-text-muted">{issue.issueKey}</span>
      )}
      <span className={cn(
        'text-text-primary leading-tight',
        full ? 'line-clamp-2 text-xs' : 'truncate text-[11px]',
      )}>
        {issue.title}
      </span>
    </button>
  )
}

// ── Detail panel wrapper ──────────────────────────────────────────────────────

function DetailPanelWrapper({
  issueId, boardId, panelWidth, startResize, onClose,
}: {
  issueId: string; boardId: string; panelWidth: number
  startResize: (e: React.MouseEvent) => void; onClose: () => void
}) {
  const { data: board } = useQuery({
    queryKey: queryKeys.boards.detail(boardId),
    queryFn: () => import('@/api/boards').then(m => m.boardsApi.get(boardId)),
    enabled: !!boardId,
  })
  return (
    <>
      <div
        onMouseDown={startResize}
        className="w-1 shrink-0 cursor-col-resize bg-surface-border transition-colors hover:bg-primary/40"
      />
      <div style={{ width: panelWidth }} className="shrink-0 overflow-hidden">
        <IssueDetailPanel issueId={issueId} boardId={boardId} columns={board?.columns ?? []} onClose={onClose} />
      </div>
    </>
  )
}

// ── Month view ────────────────────────────────────────────────────────────────

function MonthView({
  viewYear, viewMonth, byDate, todayStr,
  onIssueClick,
}: {
  viewYear: number; viewMonth: number
  byDate: Map<string, Issue[]>; todayStr: string
  onIssueClick: (issue: Issue) => void
}) {
  const firstDow  = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMon = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMon }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const numWeeks = cells.length / 7

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Weekday headers */}
      <div className="grid shrink-0 grid-cols-7 border-b border-surface-border">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={cn(
              'py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-text-muted',
              i < 6 && 'border-e border-surface-border',
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid — fills all remaining height */}
      <div
        className="flex-1 grid grid-cols-7 overflow-hidden"
        style={{ gridTemplateRows: `repeat(${numWeeks}, 1fr)` }}
      >
        {cells.map((day, i) => {
          const isLastRow = i >= cells.length - 7
          const isLastCol = i % 7 === 6

          if (!day) {
            return (
              <div
                key={i}
                className={cn(
                  'bg-surface-muted/20',
                  !isLastCol && 'border-e border-surface-border',
                  !isLastRow && 'border-b border-surface-border',
                )}
              />
            )
          }

          const dateStr   = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const dayIssues = byDate.get(dateStr) ?? []
          const isToday   = dateStr === todayStr

          return (
            <div
              key={i}
              className={cn(
                'flex min-h-0 flex-col overflow-hidden',
                isToday ? 'bg-primary/5' : 'bg-surface',
                !isLastCol && 'border-e border-surface-border',
                !isLastRow && 'border-b border-surface-border',
              )}
            >
              {/* Date number */}
              <div className="shrink-0 px-2 pt-1.5 pb-0.5">
                <span className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                  isToday
                    ? 'bg-primary text-white'
                    : 'text-text-secondary',
                )}>
                  {day}
                </span>
              </div>

              {/* Issues — scrollable */}
              <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1 pb-1.5">
                {dayIssues.map(issue => (
                  <IssueChip
                    key={issue.id}
                    issue={issue}
                    onClick={() => onIssueClick(issue)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Week view ─────────────────────────────────────────────────────────────────

function WeekView({
  weekStart, byDate, todayStr,
  onIssueClick,
}: {
  weekStart: Date
  byDate: Map<string, Issue[]>; todayStr: string
  onIssueClick: (issue: Issue) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  return (
    <div className="flex flex-1 overflow-hidden border-t border-surface-border">
      {days.map((day, i) => {
        const dateStr   = toYMD(day)
        const dayIssues = byDate.get(dateStr) ?? []
        const isToday   = dateStr === todayStr
        const isLastCol = i === 6

        return (
          <div
            key={i}
            className={cn(
              'flex min-w-0 flex-1 flex-col overflow-hidden',
              !isLastCol && 'border-e border-surface-border',
            )}
          >
            {/* Day header */}
            <div className={cn(
              'shrink-0 border-b border-surface-border px-3 py-2',
              isToday ? 'bg-primary/5' : 'bg-surface-muted/30',
            )}>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                {WEEKDAYS[day.getDay()]}
              </div>
              <div className={cn(
                'mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold',
                isToday ? 'bg-primary text-white' : 'text-text-primary',
              )}>
                {day.getDate()}
              </div>
            </div>

            {/* Issues — scrollable column */}
            <div className={cn(
              'flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2',
              isToday && 'bg-primary/2',
            )}>
              {dayIssues.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <span className="text-[11px] text-text-muted">—</span>
                </div>
              ) : (
                dayIssues.map(issue => (
                  <IssueChip
                    key={issue.id}
                    issue={issue}
                    full
                    onClick={() => onIssueClick(issue)}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { user } = useAuthStore()
  const now       = new Date()
  const todayStr  = toYMD(now)

  const [viewMode,  setViewMode]  = useState<ViewMode>('month')
  const [viewYear,  setViewYear]  = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [weekStart, setWeekStart] = useState(() => getWeekStart(now))

  const [relation,    setRelation]    = useState<Relation>('all')
  const [boardFilter, setBoardFilter] = useState<string | null>(null)
  const [search,      setSearch]      = useState('')

  const [detailIssueId, setDetailIssueId] = useState<string | null>(null)
  const [detailBoardId, setDetailBoardId] = useState<string | null>(null)
  const MIN_PANEL = 680
  const [panelWidth, setPanelWidth] = useState(MIN_PANEL)

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX, startW = panelWidth
    const onMove = (ev: MouseEvent) => {
      const max = Math.max(window.innerWidth / 2, MIN_PANEL)
      setPanelWidth(Math.min(max, Math.max(MIN_PANEL, startW + (startX - ev.clientX))))
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
    setDetailBoardId(null)
    setPanelWidth(MIN_PANEL)
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  function prevPeriod() {
    if (viewMode === 'month') {
      if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
      else setViewMonth(m => m - 1)
    } else {
      setWeekStart(ws => { const d = new Date(ws); d.setDate(d.getDate() - 7); return d })
    }
  }

  function nextPeriod() {
    if (viewMode === 'month') {
      if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
      else setViewMonth(m => m + 1)
    } else {
      setWeekStart(ws => { const d = new Date(ws); d.setDate(d.getDate() + 7); return d })
    }
  }

  function goToday() {
    if (viewMode === 'month') {
      setViewYear(now.getFullYear())
      setViewMonth(now.getMonth())
    } else {
      setWeekStart(getWeekStart(now))
    }
  }

  function switchMode(mode: ViewMode) {
    if (mode === viewMode) return
    // Sync context: switch to week containing the 1st of the current month, or today if it's this month
    if (mode === 'week') {
      const inCurrentMonth = now.getFullYear() === viewYear && now.getMonth() === viewMonth
      const anchor = inCurrentMonth ? now : new Date(viewYear, viewMonth, 1)
      setWeekStart(getWeekStart(anchor))
    } else {
      // Switch to month containing the week's start
      setViewYear(weekStart.getFullYear())
      setViewMonth(weekStart.getMonth())
    }
    setViewMode(mode)
  }

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: boards = [] } = useBoards()

  const { data: page } = useQuery({
    queryKey: queryKeys.issues.mine(relation, false),
    queryFn:  () => issuesApi.mine(relation, false),
    enabled:  !!user,
  })

  const fuse = useMemo(
    () => new Fuse(page?.content ?? [], { keys: ['title','issueKey'], threshold: 0.4 }),
    [page],
  )

  const filtered = useMemo(() => {
    let issues = page?.content ?? []
    if (boardFilter)   issues = issues.filter(i => i.boardId === boardFilter)
    if (search.trim()) {
      const hits = new Set(fuse.search(search).map(r => r.item.id))
      issues = issues.filter(i => hits.has(i.id))
    }
    return issues
  }, [page, boardFilter, search, fuse])

  const byDate = useMemo(() => {
    const map = new Map<string, Issue[]>()
    for (const issue of filtered) {
      if (!issue.dueDate) continue
      const key = isoToYMD(issue.dueDate)
      const arr = map.get(key) ?? []
      arr.push(issue)
      map.set(key, arr)
    }
    return map
  }, [filtered])

  function handleIssueClick(issue: Issue) {
    setDetailIssueId(issue.id)
    setDetailBoardId(issue.boardId)
  }

  // ── Period title ──────────────────────────────────────────────────────────

  const periodTitle = viewMode === 'month'
    ? `${MONTH_NAMES[viewMonth]} ${viewYear}`
    : weekRangeTitle(weekStart)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full overflow-hidden">

      {/* Calendar panel */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Header */}
        <div className="shrink-0 border-b border-surface-border bg-surface px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">

            {/* Navigation */}
            <button
              onClick={prevPeriod}
              className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <h2 className="w-52 text-center text-sm font-semibold text-text-primary">
              {periodTitle}
            </h2>

            <button
              onClick={nextPeriod}
              className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={goToday}
              className="rounded-lg border border-surface-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-primary/30 hover:text-text-primary"
            >
              Today
            </button>

            {/* Month / Week toggle */}
            <div className="flex items-center gap-0.5 rounded-lg bg-surface-muted p-0.5">
              <button
                onClick={() => switchMode('month')}
                title="Month view"
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  viewMode === 'month'
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-primary',
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Month
              </button>
              <button
                onClick={() => switchMode('week')}
                title="Week view"
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  viewMode === 'week'
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-primary',
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Week
              </button>
            </div>

            {/* Relation tabs */}
            <div className="ms-1 flex items-center gap-0.5 rounded-lg bg-surface-muted p-0.5">
              {(['all','assigned','created'] as Relation[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRelation(r)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    relation === r
                      ? 'bg-surface text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-primary',
                  )}
                >
                  {r === 'all' ? 'All' : r === 'assigned' ? 'Assigned' : 'Created'}
                </button>
              ))}
            </div>

            {/* Search + board filter */}
            <div className="ms-auto flex items-center gap-2">
              <div className="flex h-7 items-center gap-1.5 rounded-lg border border-surface-border bg-surface-muted px-2 text-xs focus-within:border-primary/50">
                <Search className="h-3 w-3 shrink-0 text-text-muted" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search issues…"
                  className="w-36 bg-transparent text-text-primary outline-none placeholder:text-text-muted"
                />
                {search && (
                  <X
                    className="h-3 w-3 cursor-pointer text-text-muted hover:text-text-primary"
                    onClick={() => setSearch('')}
                  />
                )}
              </div>
              <BoardFilter boards={boards} value={boardFilter} onChange={setBoardFilter} />
            </div>
          </div>
        </div>

        {/* Calendar body — fills all remaining height */}
        {viewMode === 'month' ? (
          <MonthView
            viewYear={viewYear}
            viewMonth={viewMonth}
            byDate={byDate}
            todayStr={todayStr}
            onIssueClick={handleIssueClick}
          />
        ) : (
          <WeekView
            weekStart={weekStart}
            byDate={byDate}
            todayStr={todayStr}
            onIssueClick={handleIssueClick}
          />
        )}
      </div>

      {/* Issue detail split panel */}
      {detailIssueId && detailBoardId && (
        <DetailPanelWrapper
          issueId={detailIssueId}
          boardId={detailBoardId}
          panelWidth={panelWidth}
          startResize={startResize}
          onClose={closeDetail}
        />
      )}
    </div>
  )
}
