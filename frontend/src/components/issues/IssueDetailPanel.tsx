import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X,
  Link2,
  MessageSquare,
  Clock,
  AlertCircle,
  ChevronDown,
  Check,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { issuesApi } from '@/api/issues'
import { queryKeys } from '@/api/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils/cn'
import type { Issue, Comment, Activity } from '@/types/issue'
import type { BoardColumn } from '@/types/board'

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  EPIC:    { label: 'Epic',    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  STORY:   { label: 'Story',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  TASK:    { label: 'Task',    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  BUG:     { label: 'Bug',     color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  SUBTASK: { label: 'Subtask', color: 'bg-surface-border text-text-secondary' },
} as const

const PRIORITY_CONFIG = {
  CRITICAL: { label: 'Critical', dot: 'bg-red-500' },
  HIGH:     { label: 'High',     dot: 'bg-orange-500' },
  MEDIUM:   { label: 'Medium',   dot: 'bg-yellow-500' },
  LOW:      { label: 'Low',      dot: 'bg-slate-400' },
} as const

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function fmtDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function userInitials(userId: string) {
  return userId.slice(0, 2).toUpperCase()
}

// ─── Inline text edit ────────────────────────────────────────────────────────

function InlineText({
  value,
  onSave,
  placeholder = 'Click to edit…',
  multiline = false,
  className = '',
}: {
  value: string
  onSave: (v: string) => void
  placeholder?: string
  multiline?: boolean
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  useEffect(() => { if (!editing) setDraft(value) }, [value, editing])

  const commit = () => {
    if (draft.trim() && draft.trim() !== value) onSave(draft.trim())
    setEditing(false)
  }

  const cancel = () => { setDraft(value); setEditing(false) }

  if (editing) {
    const shared = {
      ref,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) { e.preventDefault(); commit() }
        if (e.key === 'Escape') cancel()
      },
      className: cn(
        'w-full rounded-md border border-primary bg-surface px-2 py-1 text-text-primary outline-none',
        'focus:ring-2 focus:ring-primary/20',
        className
      ),
    }
    return multiline
      ? <textarea {...shared as React.TextareaHTMLAttributes<HTMLTextAreaElement>} rows={4} />
      : <input {...shared as React.InputHTMLAttributes<HTMLInputElement>} />
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={cn(
        'group relative cursor-text rounded-md px-2 py-1 transition-colors hover:bg-surface-muted',
        className
      )}
    >
      {value || <span className="text-text-muted">{placeholder}</span>}
      <Pencil className="absolute end-2 top-2 h-3 w-3 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  )
}

// ─── Inline select ───────────────────────────────────────────────────────────

function InlineSelect<T extends string>({
  value,
  options,
  renderValue,
  renderOption,
  onSave,
}: {
  value: T
  options: T[]
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
        className="flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-surface-muted"
      >
        {renderValue(value)}
        <ChevronDown className="h-3 w-3 text-text-muted" />
      </button>
      {open && (
        <div className="absolute start-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-surface-border bg-surface shadow-lg">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onSave(opt); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-muted"
            >
              {opt === value && <Check className="h-3 w-3 text-primary shrink-0" />}
              <span className={opt !== value ? 'ms-5' : ''}>{renderOption(opt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Metadata field row ──────────────────────────────────────────────────────

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="w-24 shrink-0 pt-0.5 text-xs text-text-muted">{label}</span>
      <div className="flex-1 text-sm">{children}</div>
    </div>
  )
}

// ─── Metadata sidebar ────────────────────────────────────────────────────────

function MetadataSidebar({
  issue,
  columns,
  onUpdate,
}: {
  issue: Issue
  columns: BoardColumn[]
  onUpdate: (data: Partial<Issue>) => void
}) {
  const column = columns.find((c) => c.id === issue.columnId)

  return (
    <div className="w-56 shrink-0 overflow-y-auto border-s border-surface-border bg-surface-muted px-3 py-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
        Details
      </p>

      <MetaRow label="Type">
        <InlineSelect
          value={issue.type}
          options={['EPIC', 'STORY', 'TASK', 'BUG', 'SUBTASK'] as const as Issue['type'][]}
          renderValue={(v) => (
            <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', TYPE_CONFIG[v].color)}>
              {TYPE_CONFIG[v].label}
            </span>
          )}
          renderOption={(v) => (
            <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', TYPE_CONFIG[v].color)}>
              {TYPE_CONFIG[v].label}
            </span>
          )}
          onSave={(type) => onUpdate({ type })}
        />
      </MetaRow>

      <MetaRow label="Priority">
        <InlineSelect
          value={issue.priority}
          options={['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const as Issue['priority'][]}
          renderValue={(v) => (
            <span className="flex items-center gap-1.5 text-sm text-text-primary">
              <span className={cn('h-2 w-2 rounded-full', PRIORITY_CONFIG[v].dot)} />
              {PRIORITY_CONFIG[v].label}
            </span>
          )}
          renderOption={(v) => (
            <span className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', PRIORITY_CONFIG[v].dot)} />
              {PRIORITY_CONFIG[v].label}
            </span>
          )}
          onSave={(priority) => onUpdate({ priority })}
        />
      </MetaRow>

      <MetaRow label="Status">
        <InlineSelect
          value={issue.columnId}
          options={columns.map((c) => c.id)}
          renderValue={(v) => {
            const col = columns.find((c) => c.id === v)
            return (
              <span className="flex items-center gap-1.5 text-sm text-text-primary">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: col?.color ?? '#6B7280' }}
                />
                {col?.name ?? v}
              </span>
            )
          }}
          renderOption={(v) => {
            const col = columns.find((c) => c.id === v)
            return (
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: col?.color ?? '#6B7280' }}
                />
                {col?.name ?? v}
              </span>
            )
          }}
          onSave={(columnId) => onUpdate({ columnId })}
        />
      </MetaRow>

      <div className="my-3 border-t border-surface-border" />

      <MetaRow label="Assignee">
        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          {issue.assigneeId ? (
            <>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-subtle text-[9px] font-semibold text-primary">
                {userInitials(issue.assigneeId)}
              </div>
              <span className="font-mono text-xs">{issue.assigneeId.slice(0, 8)}…</span>
            </>
          ) : (
            <span className="text-text-muted">Unassigned</span>
          )}
        </div>
      </MetaRow>

      <MetaRow label="Reporter">
        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-border text-[9px] font-semibold text-text-secondary">
            {userInitials(issue.reporterId)}
          </div>
          <span className="font-mono text-xs">{issue.reporterId.slice(0, 8)}…</span>
        </div>
      </MetaRow>

      <div className="my-3 border-t border-surface-border" />

      <MetaRow label="Story pts">
        <InlineText
          value={issue.storyPoints?.toString() ?? ''}
          placeholder="—"
          onSave={(v) => {
            const n = parseInt(v)
            if (!isNaN(n)) onUpdate({ storyPoints: n })
          }}
          className="text-sm"
        />
      </MetaRow>

      <MetaRow label="Start date">
        <InlineText
          value={fmtDate(issue.startDate)}
          placeholder="—"
          onSave={(v) => onUpdate({ startDate: v ? new Date(v).toISOString() : null } as Partial<Issue>)}
          className="text-sm"
        />
      </MetaRow>

      <MetaRow label="Due date">
        <InlineText
          value={fmtDate(issue.dueDate)}
          placeholder="—"
          onSave={(v) => onUpdate({ dueDate: v ? new Date(v).toISOString() : null } as Partial<Issue>)}
          className={cn('text-sm', issue.dueDate && new Date(issue.dueDate) < new Date() && 'text-red-500')}
        />
      </MetaRow>

      {(issue.epicId || issue.parentIssueId) && (
        <>
          <div className="my-3 border-t border-surface-border" />
          {issue.epicId && (
            <MetaRow label="Epic">
              <span className="font-mono text-xs text-text-secondary">{issue.epicId.slice(0, 8)}…</span>
            </MetaRow>
          )}
          {issue.parentIssueId && (
            <MetaRow label="Parent">
              <span className="font-mono text-xs text-text-secondary">{issue.parentIssueId.slice(0, 8)}…</span>
            </MetaRow>
          )}
        </>
      )}

      <div className="my-3 border-t border-surface-border" />

      <MetaRow label="Created">
        <span className="text-xs text-text-muted">{fmtDate(issue.createdAt)}</span>
      </MetaRow>
      <MetaRow label="Updated">
        <span className="text-xs text-text-muted">{timeAgo(issue.updatedAt)}</span>
      </MetaRow>
    </div>
  )
}

// ─── Comments section ────────────────────────────────────────────────────────

function CommentsSection({ issueId }: { issueId: string }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.issues.comments(issueId),
    queryFn: () => issuesApi.comments.list(issueId),
  })

  const comments = data?.content ?? []

  const addMutation = useMutation({
    mutationFn: (text: string) => issuesApi.comments.create(issueId, text),
    onSuccess: () => {
      setDraft('')
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.comments(issueId) })
    },
    onError: () => toast.error('Failed to post comment'),
  })

  const editMutation = useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) =>
      issuesApi.comments.update(issueId, commentId, text),
    onSuccess: () => {
      setEditingId(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.comments(issueId) })
    },
    onError: () => toast.error('Failed to update comment'),
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => issuesApi.comments.delete(issueId, commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.issues.comments(issueId) }),
    onError: () => toast.error('Failed to delete comment'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {comments.length === 0 && (
        <p className="py-4 text-center text-sm text-text-muted">No comments yet. Be the first!</p>
      )}

      {comments.map((c: Comment) => (
        <div key={c.id} className="flex gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-[10px] font-semibold text-primary">
            {userInitials(c.userId)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-primary font-mono">
                {c.userId.slice(0, 8)}…
              </span>
              <span className="text-xs text-text-muted">{timeAgo(c.createdAt)}</span>
              {c.isEdited && <span className="text-xs text-text-muted">(edited)</span>}
            </div>

            {editingId === c.id ? (
              <div className="mt-1.5">
                <textarea
                  className="w-full rounded-lg border border-primary bg-surface p-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20"
                  rows={3}
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                />
                <div className="mt-1.5 flex gap-2">
                  <button
                    onClick={() => editMutation.mutate({ commentId: c.id, text: editDraft })}
                    disabled={editMutation.isPending}
                    className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-light disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-md px-3 py-1 text-xs text-text-muted hover:text-text-primary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">{c.text}</p>
            )}
          </div>

          {c.userId === user?.id && editingId !== c.id && (
            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => { setEditingId(c.id); setEditDraft(c.text) }}
                className="rounded p-1 text-text-muted hover:text-text-primary"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => deleteMutation.mutate(c.id)}
                className="rounded p-1 text-text-muted hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add comment */}
      <div className="flex gap-3 border-t border-surface-border pt-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-[10px] font-semibold text-primary">
          {user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}
        </div>
        <div className="flex-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            rows={draft ? 3 : 1}
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && draft.trim()) {
                addMutation.mutate(draft.trim())
              }
            }}
          />
          {draft.trim() && (
            <div className="mt-1.5 flex gap-2">
              <button
                onClick={() => addMutation.mutate(draft.trim())}
                disabled={addMutation.isPending}
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-light disabled:opacity-50"
              >
                {addMutation.isPending ? 'Posting…' : 'Comment'}
              </button>
              <button
                onClick={() => setDraft('')}
                className="rounded-md px-3 py-1 text-xs text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Activity section ────────────────────────────────────────────────────────

function ActivitySection({ issueId }: { issueId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.issues.activities(issueId),
    queryFn: () => issuesApi.activities.list(issueId),
  })

  const activities = data?.content ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    )
  }

  if (activities.length === 0) {
    return <p className="py-4 text-center text-sm text-text-muted">No activity yet.</p>
  }

  return (
    <div className="flex flex-col gap-1">
      {activities.map((a: Activity) => (
        <div key={a.id} className="flex gap-3 py-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-border text-[9px] font-semibold text-text-secondary">
            {userInitials(a.userId)}
          </div>
          <div className="flex-1 text-sm">
            <span className="font-medium text-text-primary font-mono">{a.userId.slice(0, 8)}… </span>
            <span className="text-text-secondary lowercase">{a.action.replace(/_/g, ' ')}</span>
            {a.details?.field && (
              <span className="text-text-muted"> · {String(a.details.field)}</span>
            )}
          </div>
          <span className="shrink-0 text-xs text-text-muted">{timeAgo(a.createdAt)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export function IssueDetailPanel({
  issueId,
  columns,
  onClose,
}: {
  issueId: string
  columns: BoardColumn[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'details' | 'comments' | 'activity'>('details')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Slide-in animation
    requestAnimationFrame(() => setVisible(true))
    // Escape key to close
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const { data: issue, isLoading, isError } = useQuery({
    queryKey: queryKeys.issues.detail(issueId),
    queryFn: () => issuesApi.get(issueId),
  })

  const mutation = useMutation({
    mutationFn: (data: Partial<Issue>) => issuesApi.update(issueId, data),
    onMutate: async (data) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.issues.detail(issueId) })
      const prev = queryClient.getQueryData<Issue>(queryKeys.issues.detail(issueId))
      queryClient.setQueryData<Issue>(queryKeys.issues.detail(issueId), (old) =>
        old ? { ...old, ...data } : old
      )
      return { prev }
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.issues.detail(issueId), ctx.prev)
      toast.error('Failed to update issue')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issueId) })
    },
  })

  const handleUpdate = useCallback((data: Partial<Issue>) => {
    mutation.mutate(data)
  }, [mutation])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/issues/${issueId}`)
    toast.success('Link copied')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed end-0 top-0 z-50 flex h-screen w-[720px] max-w-full flex-col',
          'border-s border-surface-border bg-surface shadow-2xl',
          'transition-transform duration-300 ease-out',
          visible ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
          </div>
        )}

        {isError && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-text-secondary">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm">Failed to load issue.</p>
          </div>
        )}

        {issue && (
          <>
            {/* Header */}
            <div className="flex shrink-0 items-center gap-2 border-b border-surface-border px-4 py-3">
              <span className="font-mono text-xs font-semibold text-text-muted">
                {issue.issueKey}
              </span>
              <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', TYPE_CONFIG[issue.type].color)}>
                {TYPE_CONFIG[issue.type].label}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text-secondary">
                <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_CONFIG[issue.priority].dot)} />
                {PRIORITY_CONFIG[issue.priority].label}
              </span>

              <div className="ms-auto flex items-center gap-1">
                <button
                  onClick={handleCopyLink}
                  className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
                  title="Copy link"
                >
                  <Link2 className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Main content */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Title */}
                <div className="px-4 pt-4">
                  <InlineText
                    value={issue.title}
                    onSave={(title) => handleUpdate({ title })}
                    className="text-lg font-semibold text-text-primary"
                  />
                </div>

                {/* Tabs */}
                <div className="flex shrink-0 gap-1 border-b border-surface-border px-4 pt-3">
                  {[
                    { id: 'details',  label: 'Description', icon: null },
                    { id: 'comments', label: 'Comments',    icon: MessageSquare, count: issue.commentCount },
                    { id: 'activity', label: 'Activity',    icon: Clock },
                  ].map(({ id, label, icon: Icon, count }) => (
                    <button
                      key={id}
                      onClick={() => setTab(id as typeof tab)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-t-md px-3 py-2 text-sm font-medium transition-colors',
                        tab === id
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-text-muted hover:text-text-primary'
                      )}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      {label}
                      {count != null && count > 0 && (
                        <span className="rounded-full bg-surface-border px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
                          {count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {tab === 'details' && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Description
                      </p>
                      <InlineText
                        value={issue.description ?? ''}
                        onSave={(description) => handleUpdate({ description })}
                        placeholder="Add a description…"
                        multiline
                        className="min-h-[120px] text-sm leading-relaxed text-text-secondary"
                      />
                    </div>
                  )}
                  {tab === 'comments' && <CommentsSection issueId={issueId} />}
                  {tab === 'activity' && <ActivitySection issueId={issueId} />}
                </div>
              </div>

              {/* Metadata sidebar */}
              <MetadataSidebar
                issue={issue}
                columns={columns}
                onUpdate={handleUpdate}
              />
            </div>
          </>
        )}
      </div>
    </>
  )
}
