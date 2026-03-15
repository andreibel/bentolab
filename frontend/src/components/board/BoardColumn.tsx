import {useEffect, useRef, useState} from 'react'
import {useDroppable} from '@dnd-kit/core'
import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable'
import {GripVertical, Pencil, Plus} from 'lucide-react'
import {useQueryClient} from '@tanstack/react-query'
import {toast} from 'sonner'
import {boardsApi} from '@/api/boards'
import {queryKeys} from '@/api/queryKeys'
import {cn} from '@/utils/cn'
import {IssueCard} from './IssueCard'
import type {BoardColumn as BoardColumnType} from '@/types/board'
import type {Issue} from '@/types/issue'
import type {Epic} from '@/types/epic'
import * as React from "react";

const COL_COLORS = [
  '#6B7280', '#EF4444', '#F97316', '#EAB308',
  '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6',
]

// ── Column edit popover ────────────────────────────────────────────────────────

function EditColumnPopover({
  column,
  onClose,
}: {
  column: BoardColumnType
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const ref = useRef<HTMLDivElement>(null)

  const [name,     setName]     = useState(column.name)
  const [color,    setColor]    = useState(column.color ?? COL_COLORS[0])
  const [wipLimit, setWipLimit] = useState<string>(column.wipLimit != null ? String(column.wipLimit) : '')
  const [saving,   setSaving]   = useState(false)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await boardsApi.updateColumn(column.boardId, column.id, {
        name: name.trim(),
        color,
        wipLimit: wipLimit ? parseInt(wipLimit, 10) : null,
      })
      await queryClient.invalidateQueries({queryKey: queryKeys.boards.detail(column.boardId)})
      toast.success('Column updated')
      onClose()
    } catch {
      toast.error('Failed to update column')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={ref}
      className="absolute inset-s-0 top-full z-50 mt-1 w-64 rounded-xl border border-surface-border bg-surface p-4 shadow-2xl"
    >
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-muted">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-1.5 text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-text-muted">Color</label>
          <div className="flex flex-wrap gap-1.5">
            {COL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-5 w-5 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  boxShadow: color === c ? `0 0 0 2px var(--color-surface), 0 0 0 3px ${c}` : 'none',
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-muted">WIP limit <span className="opacity-60">(optional)</span></label>
          <input
            type="number"
            min="1"
            value={wipLimit}
            onChange={(e) => setWipLimit(e.target.value)}
            placeholder="No limit"
            className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-1.5 text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1 text-xs text-text-muted hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-light disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Column ─────────────────────────────────────────────────────────────────────

interface BoardColumnProps {
  column: BoardColumnType
  issues: Issue[]
  epicsMap?: Map<string, Epic>
  onIssueClick?: (issue: Issue) => void
  onAddIssue?: (columnId: string) => void
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
}

export function BoardColumn({ column, issues, epicsMap, onIssueClick, onAddIssue, dragHandleProps }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  })

  const [editOpen, setEditOpen] = useState(false)

  const wipExceeded = column.wipLimit != null && issues.length > column.wipLimit

  return (
    <div className="flex h-full w-72 shrink-0 flex-col">
      {/* Column header */}
      <div className="group/header relative mb-3 flex items-center gap-2 px-1">
        {/* Drag handle */}
        <button
          {...dragHandleProps}
          className="cursor-grab touch-none rounded p-0.5 text-text-muted opacity-0 transition-all hover:bg-surface-muted hover:text-text-primary group-hover/header:opacity-100 active:cursor-grabbing"
          aria-label="Drag to reorder column"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        {/* Color dot */}
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: column.color ?? '#6B7280' }}
        />

        <span className="flex-1 truncate text-sm font-semibold text-text-primary">
          {column.name}
        </span>

        {/* Count badge */}
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[11px] font-medium',
            wipExceeded
              ? 'bg-red-500/15 text-red-500'
              : 'bg-surface-muted text-text-muted',
          )}
        >
          {issues.length}
          {column.wipLimit != null && `/${column.wipLimit}`}
        </span>

        {/* Edit button */}
        <button
          onClick={() => setEditOpen((v) => !v)}
          className="rounded p-0.5 text-text-muted opacity-0 transition-all hover:bg-surface-muted hover:text-text-primary group-hover/header:opacity-100"
          aria-label="Edit column"
        >
          <Pencil className="h-3 w-3" />
        </button>

        {/* Add button */}
        <button
          onClick={() => onAddIssue?.(column.id)}
          className="rounded p-0.5 text-text-muted opacity-0 transition-all hover:bg-surface-muted hover:text-text-primary group-hover/header:opacity-100"
          aria-label="Add issue"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>

        {/* Edit popover */}
        {editOpen && (
          <EditColumnPopover column={column} onClose={() => setEditOpen(false)} />
        )}
      </div>

      {/* Droppable area — must not scroll itself, only the inner list scrolls */}
      <div
        ref={setNodeRef}
        className={cn(
          'group/col flex min-h-24 flex-1 flex-col rounded-xl border p-2 transition-colors',
          isOver
            ? 'border-primary/40 bg-primary/5'
            : 'border-surface-border bg-surface-muted/40',
        )}
      >
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                epic={epicsMap?.get(issue.epicId ?? '')}
                onClick={onIssueClick}
              />
            ))}
          </SortableContext>

          {issues.length === 0 && (
            <div className="flex flex-1 items-center justify-center py-6 text-xs text-text-muted">
              Drop here
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
