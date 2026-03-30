import {useSortable} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import {Clock, MessageSquare} from 'lucide-react'
import {cn} from '@/utils/cn'
import {EpicTag, IssueTypeBadge, PriorityIcon} from '@/components/ui/Badge'
import {Avatar} from '@/components/ui/Avatar'
import type {Issue} from '@/types/issue'
import type {Epic} from '@/types/epic'

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
      {epic && (
        <div className="mb-1.5">
          <EpicTag title={epic.title} color={epic.color} />
        </div>
      )}

      <div className="mb-2 flex items-center justify-between gap-2">
        <IssueTypeBadge type={issue.type} />
        <PriorityIcon priority={issue.priority} />
      </div>

      <p className="mb-2 text-sm font-medium leading-snug text-text-primary line-clamp-2">
        {issue.title}
      </p>

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
          <Avatar userId={issue.assigneeId} size="sm" />
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
