import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  BookOpen, Bug, CheckSquare, Zap,
  ArrowUp, ArrowDown, Minus, MessageSquare, Clock,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Issue, IssueType, IssuePriority } from '@/types/issue'
import type { Epic } from '@/types/epic'

const TYPE_ICON: Record<IssueType, React.ReactNode> = {
  STORY:   <BookOpen    className="h-3.5 w-3.5" />,
  TASK:    <CheckSquare className="h-3.5 w-3.5" />,
  BUG:     <Bug         className="h-3.5 w-3.5" />,
  SUBTASK: <Zap         className="h-3.5 w-3.5" />,
}

const TYPE_COLOR: Record<IssueType, string> = {
  STORY:   'text-emerald-500 bg-emerald-500/10',
  TASK:    'text-blue-500 bg-blue-500/10',
  BUG:     'text-red-500 bg-red-500/10',
  SUBTASK: 'text-yellow-500 bg-yellow-500/10',
}

const PRIORITY_ICON: Record<IssuePriority, React.ReactNode> = {
  CRITICAL: <ArrowUp   className="h-3 w-3 text-red-500" />,
  HIGH:     <ArrowUp   className="h-3 w-3 text-orange-500" />,
  MEDIUM:   <Minus     className="h-3 w-3 text-yellow-500" />,
  LOW:      <ArrowDown className="h-3 w-3 text-blue-400" />,
}

interface IssueCardProps {
  issue: Issue
  epic?: Epic
  onClick?: (issue: Issue) => void
}

export function IssueCard({ issue, epic, onClick }: IssueCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
    data: { type: 'issue', columnId: issue.columnId, issue },
  })

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(issue)}
      className={cn(
        'group cursor-pointer rounded-lg border border-surface-border bg-surface p-3 transition-all',
        'hover:border-primary/30 hover:shadow-sm',
        isDragging && 'opacity-40 shadow-lg ring-2 ring-primary/30',
      )}
    >
      {/* Epic label */}
      {epic && (
        <div className="mb-1.5">
          <span
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: epic.color + '22', color: epic.color }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: epic.color }}
            />
            {epic.title}
          </span>
        </div>
      )}

      {/* Type + Priority row */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={cn('flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium', TYPE_COLOR[issue.type])}>
          {TYPE_ICON[issue.type]}
          {issue.type}
        </span>
        <div className="flex items-center gap-1">
          {PRIORITY_ICON[issue.priority]}
        </div>
      </div>

      {/* Title */}
      <p className="mb-2 text-sm font-medium leading-snug text-text-primary line-clamp-2">
        {issue.title}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-text-muted">{issue.issueKey}</span>

        <div className="flex items-center gap-2">
          {issue.storyPoints != null && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded bg-surface-muted px-1 text-[10px] font-semibold text-text-secondary">
              {issue.storyPoints}
            </span>
          )}
          {issue.commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
              <MessageSquare className="h-3 w-3" />
              {issue.commentCount}
            </span>
          )}
          {issue.totalTimeSpent > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
              <Clock className="h-3 w-3" />
              {issue.totalTimeSpent}h
            </span>
          )}
          {issue.assigneeId ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-subtle text-[9px] font-bold text-primary ring-1 ring-surface-border">
              {issue.assigneeId.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-surface-border text-[9px] text-text-muted">
              ?
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Drag overlay ghost */
export function IssueCardGhost({ issue }: { issue: Issue }) {
  return (
    <div className="cursor-grabbing rounded-lg border border-primary/40 bg-surface p-3 shadow-xl ring-2 ring-primary/20 opacity-95">
      <p className="text-sm font-medium text-text-primary line-clamp-2">{issue.title}</p>
      <span className="mt-1 block font-mono text-[10px] text-text-muted">{issue.issueKey}</span>
    </div>
  )
}
