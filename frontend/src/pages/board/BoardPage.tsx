import {useCallback, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {Link, useParams, useSearchParams} from 'react-router-dom'
import {
  closestCenter,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {arrayMove, horizontalListSortingStrategy, SortableContext, useSortable,} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import {AlertCircle, ChevronRight, Loader2, Plus, Settings, Users} from 'lucide-react'
import {BoardSettingsPanel} from '@/components/board/BoardSettingsPanel'
import {useQueryClient} from '@tanstack/react-query'
import {toast} from 'sonner'
import {boardsApi, useBoard} from '@/api/boards'
import {issuesApi, useIssues} from '@/api/issues'
import {useEpics} from '@/api/epics'
import {queryKeys} from '@/api/queryKeys'
import {BoardColumn} from '@/components/board/BoardColumn'
import {EpicFilter} from '@/components/board/EpicFilter'
import {IssueCardGhost} from '@/components/board/IssueCard'
import {AddColumnModal} from '@/components/board/AddColumnModal'
import {BoardMembersPanel} from '@/components/board/BoardMembersPanel'
import {BoardPresenceAvatars} from '@/components/board/BoardPresenceAvatars'
import {CreateIssueModal} from '@/components/issues/CreateIssueModal'
import {IssueDetailPanel} from '@/components/issues/IssueDetailPanel'
import {useBoardRealtime} from '@/hooks/useBoardRealtime'
import {useBoardPresence} from '@/hooks/useBoardPresence'
import {useAuthStore} from '@/stores/authStore'
import {cn} from '@/utils/cn'
import type {BoardColumn as BoardColumnType} from '@/types/board'
import type {Issue} from '@/types/issue'
import type {Epic} from '@/types/epic'

// ── Sortable column wrapper ───────────────────────────────────────────────────
function SortableColumn({
  column,
  issues,
  epicsMap,
  onIssueClick,
  onAddIssue,
}: {
  column: BoardColumnType
  issues: Issue[]
  epicsMap?: Map<string, Epic>
  onIssueClick?: (issue: Issue) => void
  onAddIssue?: (columnId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `col:${column.id}`,
    data: { type: 'column', column },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('h-full transition-opacity', isDragging && 'opacity-40')}
    >
      <BoardColumn
        column={column}
        issues={issues}
        epicsMap={epicsMap}
        onIssueClick={onIssueClick}
        onAddIssue={onAddIssue}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Strip the col: prefix if present, otherwise return the id as-is */
function toColumnId(id: string) {
  return id.startsWith('col:') ? id.slice(4) : id
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const { data: board, isLoading: boardLoading, isError: boardError } = useBoard(boardId!)
  const { data: issuesPage, isLoading: issuesLoading } = useIssues(boardId!, false)
  const { data: epicsData = [] } = useEpics(boardId!)

  const serverIssues = issuesPage?.content ?? []

  // ── Drag state: useState drives re-renders/dnd-kit transforms,
  //   refs let handlers always read the latest value without stale closures ───
  const [localIssues,   _setLocalIssues]   = useState<Issue[] | null>(null)
  const [localColOrder, _setLocalColOrder] = useState<string[] | null>(null)
  const localIssuesRef   = useRef<Issue[] | null>(null)
  const localColOrderRef = useRef<string[] | null>(null)

  function setLocalIssues(val: Issue[] | null) {
    localIssuesRef.current = val
    _setLocalIssues(val)
  }
  function setLocalColOrder(val: string[] | null) {
    localColOrderRef.current = val
    _setLocalColOrder(val)
  }

  const displayIssues = localIssues ?? serverIssues

  // dragModeRef: always readable from handlers without stale closure
  const dragModeRef = useRef<'issue' | 'column' | null>(null)

  // Keep a live ref to serverIssues so handlers can read it without deps
  const serverIssuesRef = useRef(serverIssues)
  useLayoutEffect(() => { serverIssuesRef.current = serverIssues })

  // ── Columns ──────────────────────────────────────────────────────────────────
  const serverCols = useMemo(
    () => [...(board?.columns ?? [])].sort((a, b) => a.position - b.position),
    [board?.columns],
  )
  const serverColsRef = useRef(serverCols)
  useLayoutEffect(() => { serverColsRef.current = serverCols })

  const sortedColumns = useMemo(() => {
    if (!localColOrder) return serverCols
    return localColOrder
      .map((id) => serverCols.find((c) => c.id === id))
      .filter(Boolean) as BoardColumnType[]
  }, [serverCols, localColOrder])

  const epicsMap = useMemo(() => new Map(epicsData.map((e) => [e.id, e])), [epicsData])
  const [selectedEpicIds, setSelectedEpicIds] = useState<Set<string>>(new Set())

  const currentUserId = useAuthStore(s => s.user?.id)
  useBoardRealtime(boardId!, sortedColumns)
  const presenceUsers = useBoardPresence(boardId!)

  const issuesByColumn = useMemo(() => {
    const src = selectedEpicIds.size > 0
      ? displayIssues.filter((i) => i.epicId != null && selectedEpicIds.has(i.epicId))
      : displayIssues
    const map = new Map<string, Issue[]>()
    for (const col of sortedColumns) map.set(col.id, [])
    for (const issue of src) {
      if (!map.has(issue.columnId)) map.set(issue.columnId, [])
      map.get(issue.columnId)!.push(issue)
    }
    for (const [, list] of map) list.sort((a, b) => a.position - b.position)
    return map
  }, [displayIssues, sortedColumns, selectedEpicIds])

  const [activeIssue,    setActiveIssue]    = useState<Issue | null>(null)
  const [activeColumn,   setActiveColumn]   = useState<BoardColumnType | null>(null)
  const [addColumnOpen,  setAddColumnOpen]  = useState(false)
  const [issueModal,     setIssueModal]     = useState<{ open: boolean; columnId?: string }>({ open: false })
  const urlIssueId = searchParams.get('issue')
  const [detailIssueId,  setDetailIssueId]  = useState<string | null>(urlIssueId)
  const openedFromUrl = useRef(!!urlIssueId)
  const [membersOpen,    setMembersOpen]    = useState(false)
  const [settingsOpen,   setSettingsOpen]   = useState(false)
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
    openedFromUrl.current = false
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  // ── Collision detection ───────────────────────────────────────────────────
  // Column drags: closestCenter among col: droppables only.
  // Issue drags: closestCenter among issues first (precise reordering);
  //   fall back to pointerWithin among columns so the drop zone activates
  //   as soon as the pointer enters the column — not just near its center.
  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const activeId = String(args.active.id)

    if (activeId.startsWith('col:')) {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) =>
          String(c.id).startsWith('col:'),
        ),
      })
    }

    // Issue drag — check issues first
    const issueContainers = args.droppableContainers.filter(
      (c) => !String(c.id).startsWith('col:'),
    )
    const issueHits = closestCenter({ ...args, droppableContainers: issueContainers })
    if (issueHits.length > 0) return issueHits

    // No issue under pointer — activate whichever column the pointer is inside
    const colContainers = args.droppableContainers.filter((c) =>
      String(c.id).startsWith('col:'),
    )
    return pointerWithin({ ...args, droppableContainers: colContainers })
  }, [])

  // ── Drag start ───────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id)

    if (id.startsWith('col:')) {
      const col = serverColsRef.current.find((c) => c.id === id.slice(4))
      dragModeRef.current = 'column'
      setActiveColumn(col ?? null)
      setLocalColOrder(serverColsRef.current.map((c) => c.id))
    } else {
      const issue = serverIssuesRef.current.find((i) => i.id === id)
      dragModeRef.current = 'issue'
      setActiveIssue(issue ?? null)
      setLocalIssues([...serverIssuesRef.current])
    }
  }, [])

  // ── Drag over ────────────────────────────────────────────────────────────────
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const mode = dragModeRef.current

    // ── Column reorder ─────────────────────────────────────────────────────
    if (mode === 'column') {
      if (!String(over.id).startsWith('col:')) return
      const activeColId = String(active.id).slice(4)
      const overColId   = String(over.id).slice(4)
      const order = localColOrderRef.current ?? serverColsRef.current.map((c) => c.id)
      const oldIdx = order.indexOf(activeColId)
      const newIdx = order.indexOf(overColId)
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return
      setLocalColOrder(arrayMove(order, oldIdx, newIdx))
      return
    }

    // ── Issue drag ─────────────────────────────────────────────────────────
    if (mode !== 'issue') return

    const current  = localIssuesRef.current ?? serverIssuesRef.current
    const dragged  = current.find((i) => i.id === String(active.id))
    if (!dragged) return

    // over.id may be an issue id or a column droppable/sortable id
    const overIssue    = current.find((i) => i.id === String(over.id))
    // Resolve target column: strip col: prefix if needed
    const targetColId  = overIssue
      ? overIssue.columnId
      : toColumnId(String(over.id))

    if (!serverColsRef.current.some((c) => c.id === targetColId)) return

    let next: Issue[]

    if (dragged.columnId === targetColId) {
      // Reorder within the same column
      if (!overIssue) return // can't reorder relative to a column, only relative to another issue
      const col = current
        .filter((i) => i.columnId === targetColId)
        .sort((a, b) => a.position - b.position)
      const oldIdx = col.findIndex((i) => i.id === String(active.id))
      const newIdx = col.findIndex((i) => i.id === String(over.id))
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return
      const reordered = arrayMove(col, oldIdx, newIdx).map((iss, idx) => ({
        ...iss,
        position: idx,
      }))
      next = current.map((i) => reordered.find((r) => r.id === i.id) ?? i)
    } else {
      // Move to a different column
      next = current.map((i) =>
        i.id === String(active.id) ? { ...i, columnId: targetColId } : i,
      )
    }

    setLocalIssues(next)
  }, [])

  // ── Drag end ─────────────────────────────────────────────────────────────────
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active } = event
    const mode = dragModeRef.current
    dragModeRef.current = null
    setActiveIssue(null)
    setActiveColumn(null)

    // ── Column reorder ─────────────────────────────────────────────────────
    if (mode === 'column') {
      // Read from ref — always the latest value, never stale
      const finalOrder = localColOrderRef.current
      setLocalColOrder(null)
      if (!finalOrder) return

      const originalOrder = serverColsRef.current.map((c) => c.id)
      if (JSON.stringify(finalOrder) === JSON.stringify(originalOrder)) return

      queryClient.setQueryData(
        queryKeys.boards.detail(boardId!),
        (old: typeof board | undefined) => {
          if (!old) return old
          const updated = finalOrder
            .map((id, idx) => {
              const col = old.columns?.find((c) => c.id === id)
              return col ? { ...col, position: idx + 1 } : null
            })
            .filter(Boolean) as BoardColumnType[]
          return { ...old, columns: updated }
        },
      )

      try {
        await boardsApi.reorderColumns(boardId!, finalOrder)
      } catch {
        toast.error('Failed to reorder columns')
        queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId!) })
      }
      return
    }

    // ── Issue move ─────────────────────────────────────────────────────────
    if (mode === 'issue') {
      // Read from ref — always the latest value, never stale
      const snapshot = localIssuesRef.current
      setLocalIssues(null)
      if (!snapshot) return

      const movedIssue = snapshot.find((i) => i.id === String(active.id))
      if (!movedIssue) return

      const colIssues = snapshot
        .filter((i) => i.columnId === movedIssue.columnId)
        .sort((a, b) => a.position - b.position)
      const position = colIssues.findIndex((i) => i.id === movedIssue.id)

      // Look up column names for the real-time event
      const originalIssue = serverIssuesRef.current.find((i) => i.id === movedIssue.id)
      const fromColumnName = serverColsRef.current.find((c) => c.id === originalIssue?.columnId)?.name
      const toColumnName = serverColsRef.current.find((c) => c.id === movedIssue.columnId)?.name

      // Commit to React Query cache before clearing local state
      queryClient.setQueryData(
        queryKeys.issues.list(boardId!, undefined, false),
        (old: { content: Issue[] } | undefined) =>
          old ? { ...old, content: snapshot } : old,
      )

      try {
        await issuesApi.move(movedIssue.id, movedIssue.columnId, position, fromColumnName, toColumnName)
      } catch {
        toast.error('Failed to move issue')
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(boardId!, undefined, false) })
      }
    }
  }, [boardId, board, queryClient])

  // ── Render ───────────────────────────────────────────────────────────────────
  if (boardLoading || issuesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (boardError || !board) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-text-secondary">Board not found or failed to load.</p>
        <Link to="/boards" className="text-sm text-primary underline">Back to boards</Link>
      </div>
    )
  }

  const bg     = board.background ?? '#5B47E0'
  const colIds = sortedColumns.map((c) => `col:${c.id}`)

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Board header */}
      <div className="flex shrink-0 items-center justify-between border-b border-surface-border bg-surface px-5 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/boards" className="text-text-muted hover:text-text-primary">Boards</Link>
          <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded" style={{ backgroundColor: bg }} />
            <span className="font-semibold text-text-primary">{board.name}</span>
            <span className="font-mono text-xs text-text-muted">{board.boardKey}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {epicsData.length > 0 && (
            <EpicFilter epics={epicsData} selected={selectedEpicIds} onChange={setSelectedEpicIds} />
          )}
          <BoardPresenceAvatars users={presenceUsers} currentUserId={currentUserId} />
          {presenceUsers.filter(u => u.userId !== currentUserId).length > 0 && (
            <div className="h-4 w-px bg-surface-border" />
          )}
          <button
            onClick={() => setMembersOpen((v) => !v)}
            title="Members"
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              membersOpen
                ? 'border-primary/40 bg-primary-subtle text-primary'
                : 'border-surface-border text-text-muted hover:border-primary/30 hover:text-text-primary'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            title="Board settings"
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              settingsOpen
                ? 'border-primary/40 bg-primary-subtle text-primary'
                : 'border-surface-border text-text-muted hover:border-primary/30 hover:text-text-primary'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIssueModal({ open: true })}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-white transition-colors hover:bg-primary-light"
          >
            <Plus className="h-3.5 w-3.5" />
            Add issue
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={colIds} strategy={horizontalListSortingStrategy}>
            <div className="flex h-full gap-4 p-5">
              {sortedColumns.map((col) => (
                <SortableColumn
                  key={col.id}
                  column={col}
                  issues={issuesByColumn.get(col.id) ?? []}
                  epicsMap={epicsMap}
                  onIssueClick={(issue) => { openedFromUrl.current = false; setDetailIssueId(issue.id) }}
                  onAddIssue={(columnId) => setIssueModal({ open: true, columnId })}
                />
              ))}

              <div className="flex w-72 shrink-0 flex-col">
                <button
                  onClick={() => setAddColumnOpen(true)}
                  className="flex h-10 items-center gap-2 rounded-lg border border-dashed border-surface-border px-3 text-sm text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                  Add column
                </button>
              </div>
            </div>
          </SortableContext>

          <DragOverlay>
            {activeIssue && <IssueCardGhost issue={activeIssue} />}
            {activeColumn && (
              <div className="w-72 rounded-xl border border-primary/40 bg-surface p-3 shadow-xl opacity-90">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: activeColumn.color ?? '#6B7280' }}
                  />
                  <span className="text-sm font-semibold text-text-primary">
                    {activeColumn.name}
                  </span>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <AddColumnModal
        open={addColumnOpen}
        onClose={() => setAddColumnOpen(false)}
        boardId={boardId!}
      />

      <CreateIssueModal
        open={issueModal.open}
        onClose={() => setIssueModal({ open: false })}
        boardId={boardId!}
        boardKey={board?.boardKey}
        boardName={board?.name}
        columnId={issueModal.columnId}
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
              columns={sortedColumns}
              onClose={closeDetail}
              defaultFullScreen={openedFromUrl.current}
            />
          </div>
        </>
      )}

      {membersOpen && (
        <BoardMembersPanel
          boardId={boardId!}
          onClose={() => setMembersOpen(false)}
        />
      )}

      {settingsOpen && (
        <BoardSettingsPanel
          board={board}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
