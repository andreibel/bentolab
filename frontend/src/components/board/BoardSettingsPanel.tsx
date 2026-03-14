import {useState} from 'react'
import {Lock, X} from 'lucide-react'
import {useQueryClient} from '@tanstack/react-query'
import {toast} from 'sonner'
import {boardsApi} from '@/api/boards'
import {queryKeys} from '@/api/queryKeys'
import type {Board} from '@/types/board'

const BOARD_COLORS = [
  '#5B47E0', '#7C3AED', '#DB2777', '#DC2626',
  '#EA580C', '#CA8A04', '#16A34A', '#0891B2',
  '#1D4ED8', '#374151',
]

interface Props {
  board: Board & { columns?: unknown[] }
  onClose: () => void
}

export function BoardSettingsPanel({ board, onClose }: Props) {
  const queryClient = useQueryClient()

  const [name,        setName]        = useState(board.name)
  const [description, setDescription] = useState(board.description ?? '')
  const [background,  setBackground]  = useState(board.background ?? BOARD_COLORS[0])
  const [saving,      setSaving]      = useState(false)

  const isDirty =
    name.trim() !== board.name ||
    description.trim() !== (board.description ?? '') ||
    background !== (board.background ?? BOARD_COLORS[0])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await boardsApi.update(board.id, {
        name:        name.trim(),
        description: description.trim() || undefined,
        background,
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(board.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all('') })
      toast.success('Board updated')
      onClose()
    } catch {
      toast.error('Failed to update board')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-s border-surface-border bg-surface">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-surface-border px-5 py-4">
        <h2 className="text-sm font-semibold text-text-primary">Board Settings</h2>
        <button
          onClick={onClose}
          className="rounded p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
        {/* Board key (read-only) */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-muted">
            <Lock className="h-3 w-3" />
            Board key
          </label>
          <div className="flex h-9 items-center rounded-lg border border-surface-border bg-surface-muted px-3 font-mono text-sm text-text-muted">
            {board.boardKey}
          </div>
          <p className="mt-1 text-[11px] text-text-muted">The key cannot be changed after creation.</p>
        </div>

        {/* Name */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Board name"
            className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What is this board for?"
            className="w-full resize-none rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* Background color */}
        <div>
          <label className="mb-2 block text-xs font-medium text-text-muted">Color</label>
          <div className="flex flex-wrap gap-2">
            {BOARD_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setBackground(c)}
                className="h-7 w-7 rounded-lg transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  boxShadow:
                    background === c
                      ? `0 0 0 2px var(--color-surface), 0 0 0 4px ${c}`
                      : 'none',
                }}
              />
            ))}
          </div>
          {/* Custom hex */}
          <div className="mt-3 flex items-center gap-2">
            <div
              className="h-7 w-7 shrink-0 rounded-lg border border-surface-border"
              style={{ backgroundColor: background }}
            />
            <input
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="#5B47E0"
              className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-1.5 font-mono text-xs text-text-primary outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-surface-border p-4">
        <button
          onClick={handleSave}
          disabled={!isDirty || !name.trim() || saving}
          className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
