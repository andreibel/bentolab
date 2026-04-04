import {useRef, useState} from 'react'
import {Archive, Clock, Kanban, LayoutGrid, MoreHorizontal, Plus, RotateCcw} from 'lucide-react'
import {Link} from 'react-router-dom'
import {useQueryClient} from '@tanstack/react-query'
import {toast} from 'sonner'
import {boardsApi, useBoards} from '@/api/boards'
import {queryKeys} from '@/api/queryKeys'
import {CreateBoardWizard} from '@/components/board/CreateBoardWizard'
import {useAuthStore} from '@/stores/authStore'
import {cn} from '@/utils/cn'
import type {Board} from '@/types/board'

const BOARD_TYPE_LABEL: Record<Board['boardType'], string> = {
  SCRUM:        'Scrum',
  KANBAN:       'Kanban',
  BUG_TRACKING: 'Bug Tracking',
  CUSTOM:       'Custom',
}

const BOARD_TYPE_COLOR: Record<Board['boardType'], string> = {
  SCRUM:        'bg-primary-subtle text-primary',
  KANBAN:       'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  BUG_TRACKING: 'bg-red-500/10 text-red-600 dark:text-red-400',
  CUSTOM:       'bg-surface-muted text-text-secondary',
}

// ── Board card ─────────────────────────────────────────────────────────────────

function BoardCard({
  board,
  onArchiveToggle,
  archiving,
}: {
  board: Board
  onArchiveToggle: (board: Board) => void
  archiving: boolean
}) {
  const { orgRole } = useAuthStore()
  const bg = board.background ?? '#5B47E0'
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isOrgAdmin = orgRole === 'ORG_OWNER' || orgRole === 'ORG_ADMIN'

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-surface-border bg-surface transition-all hover:border-primary/30 hover:shadow-md">
      <Link to={`/boards/${board.id}`} className="flex flex-1 flex-col">
        <div className="h-2 w-full" style={{ backgroundColor: bg }} />
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-text-primary transition-colors group-hover:text-primary">
                {board.name}
              </p>
              <p className="mt-0.5 font-mono text-xs text-text-muted">{board.boardKey}</p>
            </div>
            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', BOARD_TYPE_COLOR[board.boardType])}>
              {BOARD_TYPE_LABEL[board.boardType]}
            </span>
          </div>

          {board.description && (
            <p className="line-clamp-2 text-sm text-text-secondary">{board.description}</p>
          )}

          <div className="mt-auto flex items-center gap-4 border-t border-surface-border pt-2 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Kanban className="h-3.5 w-3.5" />
              {board.issueCounter} issues
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {new Date(board.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Link>

      {/* Context menu — only for org admins (board-level role check done server-side) */}
      {isOrgAdmin && (
        <div
          ref={menuRef}
          className="absolute end-2 top-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-muted hover:text-text-primary"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute end-0 top-8 z-20 min-w-[160px] rounded-lg border border-surface-border bg-surface shadow-xl">
                <button
                  onClick={() => { onArchiveToggle(board); setMenuOpen(false) }}
                  disabled={archiving}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary disabled:opacity-50"
                >
                  <Archive className="h-3.5 w-3.5" />
                  {board.isArchived ? 'Unarchive' : 'Archive board'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Archived board row ─────────────────────────────────────────────────────────

function ArchivedBoardRow({
  board,
  onUnarchive,
  unarchiving,
}: {
  board: Board
  onUnarchive: (board: Board) => void
  unarchiving: boolean
}) {
  const bg = board.background ?? '#5B47E0'
  return (
    <div className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface px-4 py-3 opacity-70">
      <div className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: bg }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{board.name}</p>
        <p className="font-mono text-xs text-text-muted">{board.boardKey}</p>
      </div>
      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', BOARD_TYPE_COLOR[board.boardType])}>
        {BOARD_TYPE_LABEL[board.boardType]}
      </span>
      <p className="shrink-0 text-xs text-text-muted">
        {new Date(board.updatedAt).toLocaleDateString()}
      </p>
      <button
        onClick={() => onUnarchive(board)}
        disabled={unarchiving}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-surface-border px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary disabled:opacity-50"
      >
        <RotateCcw className="h-3 w-3" />
        Restore
      </button>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-border bg-surface py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-subtle">
        <LayoutGrid className="h-7 w-7 text-primary" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-text-primary">No boards yet</h3>
      <p className="mb-6 text-sm text-text-secondary">
        Create your first board to start tracking issues.
      </p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light"
      >
        <Plus className="h-4 w-4" />
        Create board
      </button>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function BoardListPage() {
  const { data: boards, isLoading, isError } = useBoards()
  const queryClient = useQueryClient()
  const [modalOpen,      setModalOpen]      = useState(false)
  const [showArchived,   setShowArchived]   = useState(false)
  const [archivingId,    setArchivingId]    = useState<string | null>(null)

  const activeBoards   = boards?.filter((b) => !b.isArchived) ?? []
  const archivedBoards = boards?.filter((b) =>  b.isArchived) ?? []

  const handleArchiveToggle = async (board: Board) => {
    setArchivingId(board.id)
    try {
      await boardsApi.archive(board.id)
      await queryClient.invalidateQueries({ queryKey: queryKeys.boards.all('') })
      toast.success(board.isArchived ? `"${board.name}" restored` : `"${board.name}" archived`)
    } catch {
      toast.error('Failed to update board')
    } finally {
      setArchivingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Boards</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            {activeBoards.length} active board{activeBoards.length !== 1 ? 's' : ''}
            {archivedBoards.length > 0 && ` · ${archivedBoards.length} archived`}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
        >
          <Plus className="h-4 w-4" />
          New board
        </button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-surface-border" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load boards. Check that the board service is running.
        </div>
      )}

      {!isLoading && !isError && activeBoards.length === 0 && archivedBoards.length === 0 && (
        <EmptyState onCreateClick={() => setModalOpen(true)} />
      )}

      {/* Active boards */}
      {!isLoading && !isError && activeBoards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeBoards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onArchiveToggle={handleArchiveToggle}
              archiving={archivingId === board.id}
            />
          ))}
        </div>
      )}

      {/* Archived section */}
      {!isLoading && !isError && archivedBoards.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="mb-3 flex items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
          >
            <Archive className="h-4 w-4" />
            Archived boards ({archivedBoards.length})
            <span className="text-xs">{showArchived ? '▲' : '▼'}</span>
          </button>

          {showArchived && (
            <div className="flex flex-col gap-2">
              {archivedBoards.map((board) => (
                <ArchivedBoardRow
                  key={board.id}
                  board={board}
                  onUnarchive={handleArchiveToggle}
                  unarchiving={archivingId === board.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <CreateBoardWizard open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
