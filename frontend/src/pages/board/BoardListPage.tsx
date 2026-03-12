import { useState } from 'react'
import { Kanban, Plus, LayoutGrid, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBoards } from '@/api/boards'
import { CreateBoardWizard } from '@/components/board/CreateBoardWizard'
import { cn } from '@/utils/cn'
import type { Board } from '@/types/board'

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

function BoardCard({ board }: { board: Board }) {
  const bg = board.background ?? '#5B47E0'

  return (
    <Link
      to={`/boards/${board.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-surface-border bg-surface transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className="h-2 w-full" style={{ backgroundColor: bg }} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-text-primary transition-colors group-hover:text-primary">
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
  )
}

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

export default function BoardListPage() {
  const { data: boards, isLoading, isError } = useBoards()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Boards</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            {boards?.length ?? 0} board{boards?.length !== 1 ? 's' : ''} in this organization
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

      {!isLoading && !isError && boards?.length === 0 && (
        <EmptyState onCreateClick={() => setModalOpen(true)} />
      )}

      {!isLoading && !isError && boards && boards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      )}

      <CreateBoardWizard open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
