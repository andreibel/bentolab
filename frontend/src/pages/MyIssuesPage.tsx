import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useQuery} from '@tanstack/react-query'
import Fuse from 'fuse.js'
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Bug,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  Circle,
  Minus,
  Search,
  SlidersHorizontal,
  X,
  Zap,
} from 'lucide-react'
import {issuesApi} from '@/api/issues'
import {useBoards} from '@/api/boards'
import {queryKeys} from '@/api/queryKeys'
import {useAuthStore} from '@/stores/authStore'
import {IssueDetailPanel} from '@/components/issues/IssueDetailPanel'
import {cn} from '@/utils/cn'
import type {Issue, IssuePriority, IssueType} from '@/types/issue'
import type {Board} from '@/types/board'

// ── Constants ─────────────────────────────────────────────────────────────────

type Relation = 'all' | 'assigned' | 'created'
type SortKey  = 'priority' | 'dueDate' | 'createdAt' | 'updatedAt'

const PRIORITY_ORDER: Record<IssuePriority, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

const PRIORITY_META: Record<IssuePriority, { label: string; color: string; icon: React.ReactNode }> = {
  CRITICAL: { label: 'Critical', color: 'text-red-500',    icon: <ArrowUp   className="h-3 w-3" /> },
  HIGH:     { label: 'High',     color: 'text-orange-500', icon: <ArrowUp   className="h-3 w-3" /> },
  MEDIUM:   { label: 'Medium',   color: 'text-yellow-500', icon: <Minus     className="h-3 w-3" /> },
  LOW:      { label: 'Low',      color: 'text-blue-400',   icon: <ArrowDown className="h-3 w-3" /> },
}

const TYPE_META: Record<IssueType, { label: string; color: string; icon: React.ReactNode }> = {
  STORY:   { label: 'Story',   color: 'text-emerald-500', icon: <BookOpen    className="h-3 w-3" /> },
  TASK:    { label: 'Task',    color: 'text-blue-500',    icon: <CheckSquare className="h-3 w-3" /> },
  BUG:     { label: 'Bug',     color: 'text-red-500',     icon: <Bug         className="h-3 w-3" /> },
  SUBTASK: { label: 'Sub',     color: 'text-yellow-500',  icon: <Zap         className="h-3 w-3" /> },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function isOverdue(iso: string | null) {
  return iso ? new Date(iso) < new Date() : false
}

// ── Board search dropdown ─────────────────────────────────────────────────────

function BoardFilter({
  boards,
  value,
  onChange,
}: {
  boards: Board[]
  value: string | null
  onChange: (id: string | null) => void
}) {
  const [open, setOpen]     = useState(false)
  const [query, setQuery]   = useState('')
  const ref                 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const fuse = useMemo(() => new Fuse(boards, { keys: ['name', 'boardKey'], threshold: 0.4 }), [boards])
  const results = query.trim() ? fuse.search(query).map(r => r.item) : boards

  const selected = boards.find(b => b.id === value)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-colors',
          value
            ? 'border-primary/40 bg-primary/5 text-primary'
            : 'border-surface-border text-text-muted hover:border-primary/30 hover:text-text-primary',
        )}
      >
        {selected ? (
          <>
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: selected.background ?? '#6B7280' }}
            />
            <span className="max-w-[120px] truncate">{selected.name}</span>
            <X className="h-3 w-3 opacity-60" onClick={(e) => { e.stopPropagation(); onChange(null) }} />
          </>
        ) : (
          <>Board <ChevronDown className="h-3 w-3 opacity-60" /></>
        )}
      </button>

      {open && (
        <div className="absolute start-0 top-full z-50 mt-1 w-56 rounded-xl border border-surface-border bg-surface shadow-xl">
          <div className="p-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-muted px-2 py-1.5">
              <Search className="h-3 w-3 shrink-0 text-text-muted" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search boards…"
                className="flex-1 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-muted"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto pb-2">
            {results.map(b => (
              <button
                key={b.id}
                onClick={() => { onChange(b.id); setOpen(false); setQuery('') }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-surface-muted',
                  value === b.id && 'bg-primary/5 text-primary',
                )}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: b.background ?? '#6B7280' }} />
                <span className="flex-1 truncate text-start">{b.name}</span>
                <span className="font-mono text-text-muted">{b.boardKey}</span>
              </button>
            ))}
            {results.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-text-muted">No boards found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Pill filter ───────────────────────────────────────────────────────────────

function PillFilter<T extends string>({
  label,
  options,
  value,
  onChange,
  renderOption,
}: {
  label: string
  options: T[]
  value: T | null
  onChange: (v: T | null) => void
  renderOption: (v: T) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-colors',
          value
            ? 'border-primary/40 bg-primary/5 text-primary'
            : 'border-surface-border text-text-muted hover:border-primary/30 hover:text-text-primary',
        )}
      >
        {value ? renderOption(value) : <>{label} <ChevronDown className="h-3 w-3 opacity-60" /></>}
        {value && <X className="h-3 w-3 opacity-60" onClick={(e) => { e.stopPropagation(); onChange(null) }} />}
      </button>
      {open && (
        <div className="absolute start-0 top-full z-50 mt-1 min-w-[140px] rounded-xl border border-surface-border bg-surface shadow-xl py-1">
          {options.map(o => (
            <button
              key={o}
              onClick={() => { onChange(o); setOpen(false) }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-surface-muted',
                value === o && 'bg-primary/5 text-primary',
              )}
            >
              {renderOption(o)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Issue row ─────────────────────────────────────────────────────────────────

function IssueRow({
  issue,
  boardName,
  boardColor,
  userId,
  onClick,
}: {
  issue: Issue
  boardName: string
  boardColor: string
  userId: string
  onClick: () => void
}) {
  const p = PRIORITY_META[issue.priority]
  const t = TYPE_META[issue.type]
  const overdue = isOverdue(issue.dueDate)

  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer items-center gap-3 border-b border-surface-border/50 px-4 py-2.5 text-sm transition-colors hover:bg-surface-muted/50 last:border-b-0"
    >
      {/* Priority */}
      <span className={cn('shrink-0', p.color)}>{p.icon}</span>

      {/* Type */}
      <span className={cn('shrink-0', t.color)}>{t.icon}</span>

      {/* Key */}
      <span className="shrink-0 font-mono text-[11px] text-text-muted w-16">{issue.issueKey}</span>

      {/* Title */}
      <span className="flex-1 truncate text-text-primary group-hover:text-primary">{issue.title}</span>

      {/* Relation badge */}
      {issue.assigneeId === userId && issue.reporterId === userId ? (
        <span className="shrink-0 rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-500">Both</span>
      ) : issue.assigneeId === userId ? (
        <span className="shrink-0 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-500">Assigned</span>
      ) : (
        <span className="shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-text-muted">Created</span>
      )}

      {/* Board */}
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-text-muted">
        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: boardColor }} />
        <span className="max-w-[80px] truncate">{boardName}</span>
      </span>

      {/* Due date */}
      <span className={cn('shrink-0 flex items-center gap-1 text-[11px]', overdue ? 'text-red-500' : 'text-text-muted')}>
        {issue.dueDate && <CalendarDays className="h-3 w-3" />}
        {issue.dueDate ? fmtDate(issue.dueDate) : ''}
      </span>

      {/* Closed badge */}
      {issue.closed && (
        <span className="shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
          Closed
        </span>
      )}
    </div>
  )
}

// ── BoardColumnsProvider: loads columns for the selected issue's board ─────────

function IssueDetailPanelWrapper({
  issueId,
  boardId,
  boards,
  panelWidth,
  startResize,
  onClose,
}: {
  issueId: string
  boardId: string
  boards: Board[]
  panelWidth: number
  startResize: (e: React.MouseEvent) => void
  onClose: () => void
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
        <IssueDetailPanel
          issueId={issueId}
          boardId={boardId}
          columns={board?.columns ?? []}
          onClose={onClose}
        />
      </div>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MyIssuesPage() {
  const { user } = useAuthStore()

  // Filters
  const [relation,       setRelation]       = useState<Relation>('all')
  const [closedFilter,   setClosedFilter]   = useState<boolean | undefined>(false)
  const [boardFilter,    setBoardFilter]    = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | null>(null)
  const [typeFilter,     setTypeFilter]     = useState<IssueType | null>(null)
  const [sortBy,         setSortBy]         = useState<SortKey>('priority')
  const [search,         setSearch]         = useState('')

  // Detail panel
  const [detailIssueId, setDetailIssueId]   = useState<string | null>(null)
  const [detailBoardId, setDetailBoardId]   = useState<string | null>(null)
  const MIN_PANEL = 680
  const [panelWidth, setPanelWidth] = useState(MIN_PANEL)

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = panelWidth
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

  // Data
  const { data: boards = [] } = useBoards()
  const boardMap = useMemo(() => {
    const m = new Map<string, Board>()
    boards.forEach(b => m.set(b.id, b))
    return m
  }, [boards])

  const { data: page, isLoading } = useQuery({
    queryKey: queryKeys.issues.mine(relation, closedFilter),
    queryFn:  () => issuesApi.mine(relation, closedFilter),
    enabled:  !!user,
  })

  // Client-side filtering + search
  const fuse = useMemo(
    () => new Fuse(page?.content ?? [], { keys: ['title', 'issueKey'], threshold: 0.4 }),
    [page],
  )

  const filtered = useMemo(() => {
    let issues = page?.content ?? []
    if (boardFilter)    issues = issues.filter(i => i.boardId === boardFilter)
    if (priorityFilter) issues = issues.filter(i => i.priority === priorityFilter)
    if (typeFilter)     issues = issues.filter(i => i.type === typeFilter)
    if (search.trim())  issues = fuse.search(search).map(r => r.item).filter(i =>
      (!boardFilter    || i.boardId  === boardFilter) &&
      (!priorityFilter || i.priority === priorityFilter) &&
      (!typeFilter     || i.type     === typeFilter)
    )
    return [...issues].sort((a, b) => {
      if (sortBy === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (sortBy === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [page, boardFilter, priorityFilter, typeFilter, search, fuse, sortBy])

  // Group by board
  const grouped = useMemo(() => {
    const map = new Map<string, Issue[]>()
    for (const issue of filtered) {
      const arr = map.get(issue.boardId) ?? []
      arr.push(issue)
      map.set(issue.boardId, arr)
    }
    return map
  }, [filtered])

  const hasFilters = !!(boardFilter || priorityFilter || typeFilter || search)

  function clearFilters() {
    setBoardFilter(null); setPriorityFilter(null); setTypeFilter(null); setSearch('')
  }

  function openIssue(issue: Issue) {
    setDetailIssueId(issue.id)
    setDetailBoardId(issue.boardId)
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="shrink-0 border-b border-surface-border bg-surface px-5 py-3">

          {/* Relation tabs */}
          <div className="mb-3 flex items-center gap-1 rounded-lg bg-surface-muted p-0.5 w-fit">
            {(['all', 'assigned', 'created'] as Relation[]).map(r => (
              <button
                key={r}
                onClick={() => setRelation(r)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors',
                  relation === r
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-primary',
                )}
              >
                {r === 'all' ? 'All' : r === 'assigned' ? 'Assigned to me' : 'Created by me'}
              </button>
            ))}
          </div>

          {/* Search + filters row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="flex h-8 items-center gap-1.5 rounded-lg border border-surface-border bg-surface-muted px-2.5 text-xs focus-within:border-primary/50">
              <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title or key…"
                className="w-44 bg-transparent text-text-primary outline-none placeholder:text-text-muted"
              />
              {search && (
                <X className="h-3 w-3 cursor-pointer text-text-muted hover:text-text-primary" onClick={() => setSearch('')} />
              )}
            </div>

            <BoardFilter boards={boards} value={boardFilter} onChange={setBoardFilter} />

            <PillFilter
              label="Priority"
              options={['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as IssuePriority[]}
              value={priorityFilter}
              onChange={setPriorityFilter}
              renderOption={(v) => (
                <span className={cn('flex items-center gap-1.5', PRIORITY_META[v].color)}>
                  {PRIORITY_META[v].icon} {PRIORITY_META[v].label}
                </span>
              )}
            />

            <PillFilter
              label="Type"
              options={['STORY', 'TASK', 'BUG', 'SUBTASK'] as IssueType[]}
              value={typeFilter}
              onChange={setTypeFilter}
              renderOption={(v) => (
                <span className={cn('flex items-center gap-1.5', TYPE_META[v].color)}>
                  {TYPE_META[v].icon} {TYPE_META[v].label}
                </span>
              )}
            />

            {/* Status toggle */}
            <button
              onClick={() => setClosedFilter(v => v === false ? undefined : v !== true)}
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-colors',
                closedFilter === false
                  ? 'border-green-500/40 bg-green-500/5 text-green-600'
                  : closedFilter === true
                    ? 'border-surface-border/40 bg-surface-muted text-text-muted'
                    : 'border-surface-border text-text-muted hover:border-primary/30 hover:text-text-primary',
              )}
            >
              <Circle className="h-3 w-3" />
              {closedFilter === false ? 'Open' : closedFilter === true ? 'Closed' : 'All status'}
            </button>

            {/* Sort */}
            <div className="ms-auto flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-text-muted" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortKey)}
                className="h-8 rounded-lg border border-surface-border bg-surface px-2 text-xs text-text-primary outline-none focus:border-primary/50"
              >
                <option value="priority">Priority</option>
                <option value="dueDate">Due date</option>
                <option value="createdAt">Created</option>
                <option value="updatedAt">Updated</option>
              </select>
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex h-8 items-center gap-1 rounded-lg border border-surface-border px-2.5 text-xs text-text-muted hover:text-text-primary"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Issue list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <p className="text-sm font-medium text-text-primary">No issues found</p>
              <p className="text-xs text-text-muted">
                {hasFilters ? 'Try adjusting your filters' : 'Issues assigned to or created by you will appear here'}
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-5xl px-5 py-4">
              {/* Column headers */}
              <div className="mb-1 flex items-center gap-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                <span className="w-3 shrink-0" />
                <span className="w-3 shrink-0" />
                <span className="w-16 shrink-0">Key</span>
                <span className="flex-1">Title</span>
                <span className="w-16 shrink-0 text-end">Relation</span>
                <span className="w-24 shrink-0 text-end">Board</span>
                <span className="w-16 shrink-0 text-end">Due</span>
              </div>

              {[...grouped.entries()].map(([boardId, issues]) => {
                const board = boardMap.get(boardId)
                const boardName  = board?.name  ?? boardId.slice(0, 8)
                const boardColor = board?.background ?? '#6B7280'
                return (
                  <section key={boardId} className="mb-6">
                    <div className="mb-1 flex items-center gap-2 px-4">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: boardColor }} />
                      <span className="text-xs font-semibold text-text-secondary">{boardName}</span>
                      <span className="text-xs text-text-muted">· {issues.length}</span>
                    </div>
                    <div className="rounded-xl border border-surface-border bg-surface overflow-hidden">
                      {issues.map(issue => (
                        <IssueRow
                          key={issue.id}
                          issue={issue}
                          boardName={boardName}
                          boardColor={boardColor}
                          userId={user?.id ?? ''}
                          onClick={() => openIssue(issue)}
                        />
                      ))}
                    </div>
                  </section>
                )
              })}

              <p className="px-4 pb-2 text-xs text-text-muted">
                {filtered.length} issue{filtered.length !== 1 ? 's' : ''} total
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {detailIssueId && detailBoardId && (
        <IssueDetailPanelWrapper
          issueId={detailIssueId}
          boardId={detailBoardId}
          boards={boards}
          panelWidth={panelWidth}
          startResize={startResize}
          onClose={() => { setDetailIssueId(null); setDetailBoardId(null) }}
        />
      )}
    </div>
  )
}
