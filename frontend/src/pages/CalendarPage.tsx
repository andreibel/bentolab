import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Fuse from 'fuse.js'
import { ChevronLeft, ChevronRight, Search, X, ChevronDown } from 'lucide-react'
import { issuesApi } from '@/api/issues'
import { useBoards } from '@/api/boards'
import { queryKeys } from '@/api/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import { IssueDetailPanel } from '@/components/issues/IssueDetailPanel'
import { cn } from '@/utils/cn'
import type { Issue, IssuePriority, IssueType } from '@/types/issue'
import type { Board } from '@/types/board'

// ── Constants ─────────────────────────────────────────────────────────────────

type Relation = 'all' | 'assigned' | 'created'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const PRIORITY_COLORS: Record<IssuePriority, string> = {
  CRITICAL: 'bg-red-500',
  HIGH:     'bg-orange-500',
  MEDIUM:   'bg-yellow-500',
  LOW:      'bg-blue-400',
}

const PRIORITY_RING: Record<IssuePriority, string> = {
  CRITICAL: 'ring-red-500/30',
  HIGH:     'ring-orange-500/30',
  MEDIUM:   'ring-yellow-500/30',
  LOW:      'ring-blue-400/30',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toYMD(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isoToYMD(iso: string) {
  return iso.split('T')[0]
}

// ── Board filter ──────────────────────────────────────────────────────────────

function BoardFilter({ boards, value, onChange }: { boards: Board[]; value: string | null; onChange: (id: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const fuse = useMemo(() => new Fuse(boards, { keys: ['name', 'boardKey'], threshold: 0.4 }), [boards])
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
            : 'border-surface-border text-text-muted hover:border-primary/30 hover:text-text-primary',
        )}
      >
        {selected ? (
          <>
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: selected.background ?? '#6B7280' }} />
            <span className="max-w-[100px] truncate">{selected.name}</span>
            <X className="h-3 w-3 opacity-60" onClick={e => { e.stopPropagation(); onChange(null) }} />
          </>
        ) : <>Board <ChevronDown className="h-3 w-3 opacity-60" /></>}
      </button>
      {open && (
        <div className="absolute start-0 top-full z-50 mt-1 w-52 rounded-xl border border-surface-border bg-surface shadow-xl">
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
                className={cn('flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-surface-muted transition-colors', value === b.id && 'text-primary')}>
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

function IssueChip({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      className={cn(
        'flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] ring-1 transition-colors hover:bg-surface-muted',
        PRIORITY_RING[issue.priority],
        issue.closed && 'opacity-50',
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', PRIORITY_COLORS[issue.priority])} />
      <span className="truncate text-text-primary leading-tight">{issue.title}</span>
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
      <div onMouseDown={startResize} className="w-1 shrink-0 cursor-col-resize bg-surface-border transition-colors hover:bg-primary/40" />
      <div style={{ width: panelWidth }} className="shrink-0 overflow-hidden">
        <IssueDetailPanel issueId={issueId} boardId={boardId} columns={board?.columns ?? []} onClose={onClose} />
      </div>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { user } = useAuthStore()
  const now = new Date()

  const [viewYear,  setViewYear]  = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const [relation,       setRelation]       = useState<Relation>('all')
  const [boardFilter,    setBoardFilter]    = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | null>(null)
  const [typeFilter,     setTypeFilter]     = useState<IssueType | null>(null)
  const [search,         setSearch]         = useState('')

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

  useEffect(() => { if (!detailIssueId) setPanelWidth(MIN_PANEL) }, [detailIssueId])

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const { data: boards = [] } = useBoards()

  const { data: page } = useQuery({
    queryKey: queryKeys.issues.mine(relation, false),
    queryFn:  () => issuesApi.mine(relation, false),
    enabled:  !!user,
  })

  const fuse = useMemo(
    () => new Fuse(page?.content ?? [], { keys: ['title', 'issueKey'], threshold: 0.4 }),
    [page],
  )

  const filtered = useMemo(() => {
    let issues = page?.content ?? []
    if (boardFilter)    issues = issues.filter(i => i.boardId === boardFilter)
    if (priorityFilter) issues = issues.filter(i => i.priority === priorityFilter)
    if (typeFilter)     issues = issues.filter(i => i.type === typeFilter)
    if (search.trim())  issues = fuse.search(search).map(r => r.item)
      .filter(i =>
        (!boardFilter    || i.boardId  === boardFilter) &&
        (!priorityFilter || i.priority === priorityFilter) &&
        (!typeFilter     || i.type     === typeFilter)
      )
    return issues
  }, [page, boardFilter, priorityFilter, typeFilter, search, fuse])

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

  const firstDow  = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMon = new Date(viewYear, viewMonth + 1, 0).getDate()
  const todayStr  = toYMD(now)

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMon }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const MAX_CHIPS = 3

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Header */}
        <div className="shrink-0 border-b border-surface-border bg-surface px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Navigation */}
            <button onClick={prevMonth} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text-primary">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="w-40 text-center text-sm font-semibold text-text-primary">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <button onClick={nextMonth} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text-primary">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()) }}
              className="rounded-lg border border-surface-border px-2.5 py-1 text-xs text-text-muted hover:border-primary/30 hover:text-text-primary"
            >
              Today
            </button>

            {/* Relation tabs */}
            <div className="ms-2 flex items-center gap-0.5 rounded-lg bg-surface-muted p-0.5">
              {(['all', 'assigned', 'created'] as Relation[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRelation(r)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    relation === r ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary',
                  )}
                >
                  {r === 'all' ? 'All' : r === 'assigned' ? 'Assigned' : 'Created'}
                </button>
              ))}
            </div>

            <div className="ms-auto flex items-center gap-2">
              <div className="flex h-7 items-center gap-1.5 rounded-lg border border-surface-border bg-surface-muted px-2 text-xs focus-within:border-primary/50">
                <Search className="h-3 w-3 shrink-0 text-text-muted" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search issues…"
                  className="w-36 bg-transparent text-text-primary outline-none placeholder:text-text-muted"
                />
                {search && <X className="h-3 w-3 cursor-pointer text-text-muted hover:text-text-primary" onClick={() => setSearch('')} />}
              </div>
              <BoardFilter boards={boards} value={boardFilter} onChange={setBoardFilter} />
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 overflow-auto p-4">
          {/* Weekday headers */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-text-muted">{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-1" style={{ gridAutoRows: 'minmax(96px, 1fr)' }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="rounded-xl bg-surface-muted/20" />

              const dateStr   = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayIssues = byDate.get(dateStr) ?? []
              const isToday   = dateStr === todayStr
              const overflow  = dayIssues.length - MAX_CHIPS

              return (
                <div
                  key={i}
                  className={cn(
                    'flex flex-col rounded-xl border p-1.5 transition-colors',
                    isToday
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-surface-border bg-surface',
                  )}
                >
                  <span className={cn(
                    'mb-1 flex h-6 w-6 shrink-0 items-center justify-center self-end rounded-full text-xs font-semibold',
                    isToday ? 'bg-primary text-white' : 'text-text-muted',
                  )}>
                    {day}
                  </span>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    {dayIssues.slice(0, MAX_CHIPS).map(issue => (
                      <IssueChip
                        key={issue.id}
                        issue={issue}
                        onClick={() => { setDetailIssueId(issue.id); setDetailBoardId(issue.boardId) }}
                      />
                    ))}
                    {overflow > 0 && (
                      <span className="px-1 text-[10px] text-text-muted">+{overflow} more</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-3 px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Priority:</span>
            {(['CRITICAL','HIGH','MEDIUM','LOW'] as IssuePriority[]).map(p => (
              <span key={p} className="flex items-center gap-1 text-[11px] text-text-muted">
                <span className={cn('h-2 w-2 rounded-full', PRIORITY_COLORS[p])} />
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </span>
            ))}
            <span className="ms-4 text-[11px] text-text-muted">Issues shown on their due date.</span>
          </div>
        </div>
      </div>

      {detailIssueId && detailBoardId && (
        <DetailPanelWrapper
          issueId={detailIssueId}
          boardId={detailBoardId}
          panelWidth={panelWidth}
          startResize={startResize}
          onClose={() => { setDetailIssueId(null); setDetailBoardId(null) }}
        />
      )}
    </div>
  )
}
