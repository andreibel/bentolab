import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { IssueTypeBadge, PriorityBadge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'
import type { Issue } from '@/types/issue'
import type { Epic } from '@/types/epic'
import type { Sprint } from '@/types/sprint'
import type { BoardColumn } from '@/types/board'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateInput(iso: string | null | undefined) {
  if (!iso) return ''
  return new Date(iso).toISOString().split('T')[0]
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function MetaCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">{label}</span>
      <div>{children}</div>
    </div>
  )
}

function InlineSelect<T extends string>({
  value,
  options,
  renderValue,
  renderOption,
  onSave,
}: {
  value: T
  options: readonly T[]
  renderValue: (v: T) => React.ReactNode
  renderOption: (v: T) => React.ReactNode
  onSave: (v: T) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-surface-muted"
      >
        {renderValue(value)}
        <ChevronDown className="h-3 w-3 shrink-0 text-text-muted" />
      </button>
      {open && (
        <div className="absolute start-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-surface-border bg-surface shadow-xl">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onSave(opt); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-muted"
            >
              {opt === value
                ? <Check className="h-3 w-3 shrink-0 text-primary" />
                : <span className="h-3 w-3 shrink-0" />}
              {renderOption(opt)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function EpicSelect({ value, epics, onSave }: { value: string | null; epics: Epic[]; onSave: (id: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = epics.find((e) => e.id === value)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-surface-muted"
      >
        {current ? (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: current.color }} />
            <span className="max-w-[120px] truncate text-text-primary">{current.title}</span>
          </span>
        ) : (
          <span className="text-text-muted">None</span>
        )}
        <ChevronDown className="h-3 w-3 shrink-0 text-text-muted" />
      </button>
      {open && (
        <div className="absolute start-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-surface-border bg-surface shadow-xl">
          <button
            onClick={() => { onSave(null); setOpen(false) }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-muted hover:bg-surface-muted"
          >
            {!value ? <Check className="h-3 w-3 shrink-0 text-primary" /> : <span className="h-3 w-3 shrink-0" />}
            None
          </button>
          {epics.map((e) => (
            <button
              key={e.id}
              onClick={() => { onSave(e.id); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-muted"
            >
              {e.id === value ? <Check className="h-3 w-3 shrink-0 text-primary" /> : <span className="h-3 w-3 shrink-0" />}
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
              <span className="truncate">{e.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SprintSelect({ value, sprints, onSave }: { value: string | null; sprints: Sprint[]; onSave: (id: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = sprints.find((s) => s.id === value)
  const eligible = sprints.filter((s) => s.status !== 'COMPLETED')

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-surface-muted"
      >
        {current ? (
          <span className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', current.status === 'ACTIVE' ? 'bg-green-500' : 'bg-surface-border')} />
            <span className="max-w-[120px] truncate text-text-primary">{current.name}</span>
          </span>
        ) : (
          <span className="text-text-muted">Backlog</span>
        )}
        <ChevronDown className="h-3 w-3 shrink-0 text-text-muted" />
      </button>
      {open && (
        <div className="absolute start-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-surface-border bg-surface shadow-xl">
          <button
            onClick={() => { onSave(null); setOpen(false) }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-muted hover:bg-surface-muted"
          >
            {!value ? <Check className="h-3 w-3 shrink-0 text-primary" /> : <span className="h-3 w-3 shrink-0" />}
            Backlog
          </button>
          {eligible.map((s) => (
            <button
              key={s.id}
              onClick={() => { onSave(s.id); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-muted"
            >
              {s.id === value ? <Check className="h-3 w-3 shrink-0 text-primary" /> : <span className="h-3 w-3 shrink-0" />}
              <span className={cn('h-2 w-2 shrink-0 rounded-full', s.status === 'ACTIVE' ? 'bg-green-500' : 'bg-surface-border')} />
              <span className="truncate">{s.name}</span>
            </button>
          ))}
          {eligible.length === 0 && (
            <div className="px-3 py-2 text-xs text-text-muted">No active sprints</div>
          )}
        </div>
      )}
    </div>
  )
}

function StoryPointsField({ value, onSave }: { value: number | null | undefined; onSave: (n: number | null) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value?.toString() ?? '')

  useEffect(() => { if (!editing) setDraft(value?.toString() ?? '') }, [value, editing])

  const commit = () => {
    const n = draft.trim() ? parseInt(draft.trim(), 10) : null
    onSave(isNaN(n ?? 0) ? null : n)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus type="number" min={0}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="w-16 rounded border border-primary bg-surface px-2 py-0.5 text-sm text-text-primary outline-none focus:ring-1 focus:ring-primary/20"
      />
    )
  }

  return (
    <button onClick={() => setEditing(true)} className="rounded-md px-1.5 py-1 text-sm hover:bg-surface-muted">
      {value != null
        ? <span className="font-semibold text-text-primary">{value}</span>
        : <span className="text-text-muted">—</span>}
    </button>
  )
}

// ─── Public export ─────────────────────────────────────────────────────────────

const ISSUE_TYPES = ['STORY', 'TASK', 'BUG', 'SUBTASK'] as const
const PRIORITIES  = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const

interface IssueMetaPanelProps {
  issue: Issue
  columns: BoardColumn[]
  epics: Epic[]
  sprints: Sprint[]
  parentIssue?: { issueKey: string; title: string } | null
  childIssues?: Issue[]
  onUpdate: (data: Partial<Issue>) => void
}

export function IssueMetaPanel({ issue, columns, epics, sprints, parentIssue, childIssues = [], onUpdate }: IssueMetaPanelProps) {
  return (
    <div className="mb-6 grid grid-cols-3 gap-x-4 gap-y-4 rounded-xl border border-surface-border bg-surface-muted/40 p-4">

      <MetaCell label="Status">
        <InlineSelect
          value={issue.columnId}
          options={columns.map((c) => c.id)}
          renderValue={(v) => {
            const col = columns.find((c) => c.id === v)
            return (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: col?.color ?? '#6B7280' }} />
                <span className="truncate">{col?.name ?? v}</span>
              </span>
            )
          }}
          renderOption={(v) => {
            const col = columns.find((c) => c.id === v)
            return (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: col?.color ?? '#6B7280' }} />
                {col?.name ?? v}
              </span>
            )
          }}
          onSave={(columnId) => onUpdate({ columnId })}
        />
      </MetaCell>

      <MetaCell label="Priority">
        <InlineSelect
          value={issue.priority}
          options={PRIORITIES as unknown as Issue['priority'][]}
          renderValue={(v) => <PriorityBadge priority={v} showLabel />}
          renderOption={(v) => <PriorityBadge priority={v} showLabel />}
          onSave={(priority) => onUpdate({ priority })}
        />
      </MetaCell>

      <MetaCell label="Type">
        <InlineSelect
          value={issue.type}
          options={ISSUE_TYPES as unknown as Issue['type'][]}
          renderValue={(v) => <IssueTypeBadge type={v} />}
          renderOption={(v) => <IssueTypeBadge type={v} />}
          onSave={(type) => onUpdate({ type })}
        />
      </MetaCell>

      <MetaCell label="Epic">
        <EpicSelect
          value={issue.epicId ?? null}
          epics={epics}
          onSave={(epicId) => onUpdate({ epicId } as Partial<Issue>)}
        />
      </MetaCell>

      <MetaCell label="Sprint">
        <SprintSelect
          value={issue.sprintId ?? null}
          sprints={sprints}
          onSave={(sprintId) => onUpdate({ sprintId } as Partial<Issue>)}
        />
      </MetaCell>

      <MetaCell label="Assignee">
        {issue.assigneeId ? (
          <div className="flex items-center gap-1.5 px-1.5 py-1">
            <Avatar userId={issue.assigneeId} size="sm" className="shrink-0" />
            <span className="truncate font-mono text-xs text-text-secondary">{issue.assigneeId.slice(0, 8)}…</span>
          </div>
        ) : (
          <span className="px-1.5 py-1 text-sm text-text-muted">Unassigned</span>
        )}
      </MetaCell>

      <MetaCell label="Story points">
        <StoryPointsField value={issue.storyPoints} onSave={(n) => onUpdate({ storyPoints: n } as Partial<Issue>)} />
      </MetaCell>

      <MetaCell label="Reporter">
        <div className="flex items-center gap-1.5 px-1.5 py-1">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-border text-[9px] font-bold text-text-secondary">
            {issue.reporterId.slice(0, 2).toUpperCase()}
          </div>
          <span className="truncate font-mono text-xs text-text-secondary">{issue.reporterId.slice(0, 8)}…</span>
        </div>
      </MetaCell>

      <MetaCell label="Start date">
        <input
          type="date"
          value={toDateInput(issue.startDate)}
          onChange={(e) => onUpdate({ startDate: e.target.value ? new Date(e.target.value).toISOString() : null } as Partial<Issue>)}
          className="w-full rounded-md border border-surface-border bg-surface px-2 py-1 text-xs text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
      </MetaCell>

      <MetaCell label="Due date">
        <input
          type="date"
          value={toDateInput(issue.dueDate)}
          onChange={(e) => onUpdate({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null } as Partial<Issue>)}
          className={cn(
            'w-full rounded-md border border-surface-border bg-surface px-2 py-1 text-xs text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20',
            issue.dueDate && new Date(issue.dueDate) < new Date() && 'border-red-400 text-red-500',
          )}
        />
      </MetaCell>

      <MetaCell label="Created">
        <span className="px-1.5 py-1 text-xs text-text-muted">{fmtDate(issue.createdAt)}</span>
      </MetaCell>

      {issue.parentIssueId && parentIssue && (
        <MetaCell label="Parent">
          <span className="flex items-center gap-1.5 px-1.5 py-1 text-xs text-text-secondary">
            <span className="font-mono text-text-muted">{parentIssue.issueKey}</span>
            <span className="truncate">{parentIssue.title}</span>
          </span>
        </MetaCell>
      )}

    </div>
  )
}
