/**
 * Shared badge / icon components for issues.
 * Single source of truth for type colors, priority icons, and epic tags.
 */
import { BookOpen, Bug, CheckSquare, Zap, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { IssueType, IssuePriority } from '@/types/issue'

// ── Issue Type ─────────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<IssueType, string> = {
  STORY:   'text-emerald-500 bg-emerald-500/10',
  TASK:    'text-blue-500 bg-blue-500/10',
  BUG:     'text-red-500 bg-red-500/10',
  SUBTASK: 'text-yellow-500 bg-yellow-500/10',
}

/** Colored icon with matching text color, no background — for compact list rows */
export function IssueTypeIcon({ type }: { type: IssueType }) {
  const icons: Record<IssueType, React.ReactNode> = {
    STORY:   <BookOpen    className="h-3.5 w-3.5 text-emerald-500" />,
    TASK:    <CheckSquare className="h-3.5 w-3.5 text-blue-500" />,
    BUG:     <Bug         className="h-3.5 w-3.5 text-red-500" />,
    SUBTASK: <Zap         className="h-3.5 w-3.5 text-yellow-500" />,
  }
  return <>{icons[type]}</>
}

/** Pill badge: icon + label on colored background — for cards */
export function IssueTypeBadge({ type, showLabel = true }: { type: IssueType; showLabel?: boolean }) {
  const icons: Record<IssueType, React.ReactNode> = {
    STORY:   <BookOpen    className="h-3.5 w-3.5" />,
    TASK:    <CheckSquare className="h-3.5 w-3.5" />,
    BUG:     <Bug         className="h-3.5 w-3.5" />,
    SUBTASK: <Zap         className="h-3.5 w-3.5" />,
  }
  return (
    <span className={cn('flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium', TYPE_COLOR[type])}>
      {icons[type]}
      {showLabel && type}
    </span>
  )
}

// ── Priority ───────────────────────────────────────────────────────────────────

/** Single colored arrow/dash icon — for compact display */
export function PriorityIcon({ priority }: { priority: IssuePriority }) {
  const icons: Record<IssuePriority, React.ReactNode> = {
    CRITICAL: <ArrowUp   className="h-3 w-3 text-red-500" />,
    HIGH:     <ArrowUp   className="h-3 w-3 text-orange-500" />,
    MEDIUM:   <Minus     className="h-3 w-3 text-yellow-500" />,
    LOW:      <ArrowDown className="h-3 w-3 text-blue-400" />,
  }
  return <>{icons[priority]}</>
}

/** Dot + optional label */
export function PriorityBadge({ priority, showLabel = false }: { priority: IssuePriority; showLabel?: boolean }) {
  const dots: Record<IssuePriority, string> = {
    CRITICAL: 'bg-red-500',
    HIGH:     'bg-orange-500',
    MEDIUM:   'bg-yellow-500',
    LOW:      'bg-slate-400',
  }
  return (
    <span className="flex items-center gap-1.5 text-sm text-text-primary">
      <span className={cn('h-2 w-2 rounded-full', dots[priority])} />
      {showLabel && priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  )
}

// ── Epic ───────────────────────────────────────────────────────────────────────

/** Colored pill tag for epics */
export function EpicTag({ title, color }: { title: string; color: string }) {
  return (
    <span
      className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: color + '22', color }}
    >
      {title}
    </span>
  )
}
