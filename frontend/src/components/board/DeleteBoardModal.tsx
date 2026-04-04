import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useQueryClient} from '@tanstack/react-query'
import {toast} from 'sonner'
import {AlertTriangle, X} from 'lucide-react'
import {boardsApi} from '@/api/boards'
import {queryKeys} from '@/api/queryKeys'
import type {Board} from '@/types/board'

interface Props {
  board: Board
  onClose: () => void
}

export function DeleteBoardModal({ board, onClose }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [inputValue, setInputValue] = useState('')
  const [deleting, setDeleting] = useState(false)

  const confirmed = inputValue.trim() === board.name.trim()

  const handleDelete = async () => {
    if (!confirmed) return
    setDeleting(true)
    try {
      await boardsApi.delete(board.id)
      await queryClient.invalidateQueries({ queryKey: queryKeys.boards.all('') })
      toast.success(`"${board.name}" has been permanently deleted`)
      navigate('/boards')
      onClose()
    } catch {
      toast.error('Failed to delete board')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-xl border border-surface-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <h2 className="text-sm font-semibold text-text-primary">Delete board</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
            <p className="font-medium">This action cannot be undone.</p>
            <p className="mt-1 text-xs text-red-400/80">
              Permanently deletes this board along with all its issues, sprints, epics, and columns.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-secondary">
              Type <span className="font-bold text-text-primary">{board.name}</span> to confirm
            </label>
            <input
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmed && handleDelete()}
              placeholder={board.name}
              className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-surface-border px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!confirmed || deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}
