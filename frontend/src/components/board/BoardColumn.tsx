import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { GripVertical, Plus } from 'lucide-react'
import { cn } from '@/utils/cn'
import { IssueCard } from './IssueCard'
import type { BoardColumn as BoardColumnType } from '@/types/board'
import type { Issue } from '@/types/issue'
import type { Epic } from '@/types/epic'

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

  const wipExceeded = column.wipLimit != null && issues.length > column.wipLimit

  return (
    <div className="flex w-72 shrink-0 flex-col">
      {/* Column header */}
      <div className="group/header mb-3 flex items-center gap-2 px-1">
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

        {/* Add button */}
        <button
          onClick={() => onAddIssue?.(column.id)}
          className="rounded p-0.5 text-text-muted opacity-0 transition-all hover:bg-surface-muted hover:text-text-primary group-hover/header:opacity-100"
          aria-label="Add issue"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={cn(
          'group/col flex min-h-24 flex-1 flex-col gap-2 rounded-xl border p-2 transition-colors',
          isOver
            ? 'border-primary/40 bg-primary/5'
            : 'border-surface-border bg-surface-muted/40',
        )}
      >
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
  )
}
