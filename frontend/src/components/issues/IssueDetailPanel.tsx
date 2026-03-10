import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import {
  X,
  Link2,
  AlertCircle,
  ChevronDown,
  Check,
  Pencil,
  Trash2,
  Loader2,
  Bold,
  Italic,
  Code,
  List,
  ListOrdered,
  GitCommitHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'
import { issuesApi, useIssues } from '@/api/issues'
import { useEpics } from '@/api/epics'
import { useSprints } from '@/api/sprints'
import { queryKeys } from '@/api/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils/cn'
import type { Issue, Comment, Activity } from '@/types/issue'
import type { Epic } from '@/types/epic'
import type { Sprint } from '@/types/sprint'
import type { BoardColumn } from '@/types/board'

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
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

const ISSUE_TYPES = ['STORY', 'TASK', 'BUG', 'SUBTASK'] as const
const PRIORITIES  = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function toDateInput(iso: string | null | undefined) {
  if (!iso) return ''
  return new Date(iso).toISOString().split('T')[0]
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function userInitials(userId: string) {
  return userId.slice(0, 2).toUpperCase()
}

function renderMd(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped
    .replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/gs, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(0,0,0,0.06);padding:1px 5px;border-radius:3px;font-size:0.85em;font-family:monospace">$1</code>')
    .replace(/\n/g, '<br>')
}

function insertMdAt(el: HTMLTextAreaElement, setValue: (v: string) => void, prefix: string, suffix = prefix) {
  const { selectionStart: s, selectionEnd: e, value } = el
  const selected = value.slice(s, e)
  const replacement = `${prefix}${selected || 'text'}${suffix}`
  setValue(value.slice(0, s) + replacement + value.slice(e))
  requestAnimationFrame(() => {
    el.focus()
    const cur = s + prefix.length
    el.setSelectionRange(cur, cur + (selected || 'text').length)
  })
}

// ─── Inline select ────────────────────────────────────────────────────────────

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

// ─── Metadata grid cell ───────────────────────────────────────────────────────

function MetaCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">{label}</span>
      <div>{children}</div>
    </div>
  )
}

// ─── Description editor (Tiptap) ─────────────────────────────────────────────

function DescriptionEditor({ value, onSave }: { value: string; onSave: (html: string) => void }) {
  const [editing, setEditing] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editable: false,
    editorProps: {
      attributes: {
        class: [
          'outline-none min-h-[80px] text-sm leading-relaxed text-text-primary',
          '[&>p]:mb-2 [&>p:last-child]:mb-0',
          '[&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-2',
          '[&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mb-2',
          '[&>ul]:list-disc [&>ul]:ps-5 [&>ul]:mb-2',
          '[&>ol]:list-decimal [&>ol]:ps-5 [&>ol]:mb-2',
          '[&_li]:mb-0.5',
          '[&_code]:bg-surface-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs',
          '[&>pre]:bg-surface-muted [&>pre]:rounded-md [&>pre]:p-3 [&>pre]:mb-2 [&>pre]:overflow-x-auto',
          '[&>blockquote]:border-s-2 [&>blockquote]:border-primary [&>blockquote]:ps-3 [&>blockquote]:italic [&>blockquote]:text-text-secondary',
        ].join(' '),
      },
    },
  })

  useEffect(() => {
    if (editor && !editing) editor.commands.setContent(value || '')
  }, [value, editor, editing])

  useEffect(() => {
    if (editor) editor.setEditable(editing)
  }, [editor, editing])

  const save = useCallback(() => {
    if (!editor) return
    const html = editor.getHTML()
    if (html !== value) onSave(html)
    setEditing(false)
  }, [editor, value, onSave])

  const cancel = useCallback(() => {
    editor?.commands.setContent(value || '')
    setEditing(false)
  }, [editor, value])

  const isEmpty = !value || value === '<p></p>'

  return (
    <div>
      {editing && (
        <div className="mb-1 flex items-center gap-0.5 rounded-t-md border border-b-0 border-surface-border bg-surface-muted px-1.5 py-1">
          {([
            { icon: Bold,        tip: 'Bold',          fn: () => editor?.chain().focus().toggleBold().run() },
            { icon: Italic,      tip: 'Italic',        fn: () => editor?.chain().focus().toggleItalic().run() },
            { icon: Code,        tip: 'Code',          fn: () => editor?.chain().focus().toggleCode().run() },
            { icon: List,        tip: 'Bullet list',   fn: () => editor?.chain().focus().toggleBulletList().run() },
            { icon: ListOrdered, tip: 'Ordered list',  fn: () => editor?.chain().focus().toggleOrderedList().run() },
          ] as const).map(({ icon: Icon, tip, fn }) => (
            <button
              key={tip}
              onMouseDown={(e) => { e.preventDefault(); fn() }}
              title={tip}
              className="rounded p-1 text-text-muted hover:bg-surface-border hover:text-text-primary"
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}

      <div
        className={cn(
          'rounded-md transition-all',
          editing
            ? 'rounded-tl-none border border-primary px-3 py-2 ring-2 ring-primary/10'
            : 'cursor-text border border-transparent px-3 py-2 hover:border-surface-border',
        )}
        onClick={() => { if (!editing) setEditing(true) }}
      >
        {isEmpty && !editing
          ? <p className="text-sm text-text-muted">Add a description…</p>
          : <EditorContent editor={editor} />
        }
      </div>

      {editing && (
        <div className="mt-2 flex gap-2">
          <button onClick={save} className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-light">
            Save
          </button>
          <button onClick={cancel} className="rounded-md px-3 py-1 text-xs text-text-muted hover:text-text-primary">
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

// ─── MD toolbar for textareas ─────────────────────────────────────────────────

function MdToolbar({ textareaRef, setValue }: { textareaRef: React.RefObject<HTMLTextAreaElement | null>; setValue: (v: string) => void }) {
  const wrap = (prefix: string, suffix = prefix) => {
    if (textareaRef.current) insertMdAt(textareaRef.current, setValue, prefix, suffix)
  }
  return (
    <div className="flex items-center gap-0.5 px-1.5 py-1">
      {([
        { icon: Bold,   tip: 'Bold',   fn: () => wrap('**') },
        { icon: Italic, tip: 'Italic', fn: () => wrap('*') },
        { icon: Code,   tip: 'Code',   fn: () => wrap('`') },
        { icon: List,   tip: 'List',   fn: () => wrap('\n- ', '') },
      ] as const).map(({ icon: Icon, tip, fn }) => (
        <button
          key={tip}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); fn() }}
          title={tip}
          className="rounded p-1 text-text-muted hover:bg-surface-border hover:text-text-primary"
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  )
}

// ─── Timeline items ───────────────────────────────────────────────────────────

function ActivityItem({ activity }: { activity: Activity }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted">
        <GitCommitHorizontal className="h-3.5 w-3.5 text-text-muted" />
      </div>
      <p className="flex-1 pt-0.5 text-xs text-text-secondary">
        <span className="font-medium text-text-primary">{userInitials(activity.userId)}</span>
        {' '}
        {activity.action.toLowerCase().replace(/_/g, ' ')}
        {activity.details?.to && (
          <span className="font-medium text-text-primary"> → {String(activity.details.to)}</span>
        )}
      </p>
      <span className="shrink-0 pt-0.5 text-[11px] text-text-muted">{timeAgo(activity.createdAt)}</span>
    </div>
  )
}

function CommentItem({
  comment,
  issueId,
  currentUserId,
}: {
  comment: Comment
  issueId: string
  currentUserId: string | undefined
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.text)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isOwn = comment.userId === currentUserId

  const editMutation = useMutation({
    mutationFn: (text: string) => issuesApi.comments.update(issueId, comment.id, text),
    onSuccess: () => {
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.comments(issueId) })
    },
    onError: () => toast.error('Failed to update comment'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => issuesApi.comments.delete(issueId, comment.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.issues.comments(issueId) }),
    onError: () => toast.error('Failed to delete comment'),
  })

  return (
    <div className="group flex items-start gap-3 py-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-[10px] font-bold text-primary">
        {userInitials(comment.userId)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-text-primary">{comment.userId.slice(0, 8)}…</span>
          <span className="text-xs text-text-muted">{timeAgo(comment.createdAt)}</span>
          {comment.isEdited && <span className="text-xs text-text-muted">(edited)</span>}
        </div>

        {editing ? (
          <div>
            <div className="rounded-t-md border border-b-0 border-surface-border bg-surface-muted">
              <MdToolbar textareaRef={textareaRef} setValue={setDraft} />
            </div>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              autoFocus
              className="w-full rounded-b-md border border-primary bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/10"
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setDraft(comment.text); setEditing(false) }
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && draft.trim()) {
                  e.preventDefault(); editMutation.mutate(draft.trim())
                }
              }}
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => draft.trim() && editMutation.mutate(draft.trim())}
                disabled={editMutation.isPending || !draft.trim()}
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-light disabled:opacity-50"
              >
                {editMutation.isPending ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => { setDraft(comment.text); setEditing(false) }}
                className="rounded-md px-3 py-1 text-xs text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="text-sm leading-relaxed text-text-secondary [&_code]:rounded [&_code]:bg-surface-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_em]:italic [&_strong]:font-semibold [&_strong]:text-text-primary"
            dangerouslySetInnerHTML={{ __html: renderMd(comment.text) }}
          />
        )}
      </div>

      {isOwn && !editing && (
        <div className="flex shrink-0 gap-1 pt-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => { setEditing(true); setDraft(comment.text) }}
            className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Add comment form ─────────────────────────────────────────────────────────

function AddCommentForm({
  issueId,
  currentUser,
}: {
  issueId: string
  currentUser: { id: string; firstName: string; lastName: string } | null
}) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const addMutation = useMutation({
    mutationFn: (text: string) => issuesApi.comments.create(issueId, text),
    onSuccess: () => {
      setDraft(''); setFocused(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.comments(issueId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.activities(issueId) })
    },
    onError: () => toast.error('Failed to post comment'),
  })

  const initials = currentUser ? `${currentUser.firstName[0]}${currentUser.lastName[0]}` : '?'
  const active = focused || draft.length > 0

  return (
    <div className="flex gap-3 pt-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-[10px] font-bold text-primary">
        {initials}
      </div>
      <div className="flex-1">
        {active && (
          <div className="rounded-t-md border border-b-0 border-surface-border bg-surface-muted">
            <MdToolbar textareaRef={textareaRef} setValue={setDraft} />
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { if (!draft) setFocused(false) }}
          placeholder="Add a comment… (supports **bold**, *italic*, `code`)"
          rows={active ? 3 : 1}
          className={cn(
            'w-full border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted',
            active
              ? 'rounded-b-md border-primary focus:ring-2 focus:ring-primary/10'
              : 'rounded-md border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/10',
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && draft.trim()) {
              e.preventDefault(); addMutation.mutate(draft.trim())
            }
          }}
        />
        {active && (
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => draft.trim() && addMutation.mutate(draft.trim())}
              disabled={addMutation.isPending || !draft.trim()}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-light disabled:opacity-50"
            >
              {addMutation.isPending ? 'Posting…' : 'Comment'}
            </button>
            <button
              onClick={() => { setDraft(''); setFocused(false) }}
              className="rounded-md px-3 py-1 text-xs text-text-muted hover:text-text-primary"
            >
              Cancel
            </button>
            <span className="ms-auto text-[11px] text-text-muted">⌘↵ to submit</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Title editor ─────────────────────────────────────────────────────────────

function TitleEditor({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select() } }, [editing])
  useEffect(() => { if (!editing) setDraft(value) }, [value, editing])

  const commit = () => {
    if (draft.trim() && draft.trim() !== value) onSave(draft.trim())
    setEditing(false)
  }

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit() }
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
        rows={2}
        className="w-full resize-none rounded-md border border-primary bg-transparent px-1 py-0.5 text-xl font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/10"
      />
    )
  }

  return (
    <h1
      onClick={() => setEditing(true)}
      className="group relative cursor-text rounded-md px-1 py-0.5 text-xl font-bold leading-snug text-text-primary hover:bg-surface-muted"
    >
      {value}
      <Pencil className="absolute end-1 top-1.5 h-3.5 w-3.5 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
    </h1>
  )
}

// ─── Epic select ──────────────────────────────────────────────────────────────

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

// ─── Sprint select ────────────────────────────────────────────────────────────

function SprintSelect({ value, sprints, onSave }: { value: string | null; sprints: Sprint[]; onSave: (id: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = sprints.find((s) => s.id === value)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const eligible = sprints.filter((s) => s.status !== 'COMPLETED')

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

// ─── Story points inline edit ─────────────────────────────────────────────────

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
    <button
      onClick={() => setEditing(true)}
      className="rounded-md px-1.5 py-1 text-sm hover:bg-surface-muted"
    >
      {value != null ? <span className="font-semibold text-text-primary">{value}</span> : <span className="text-text-muted">—</span>}
    </button>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function IssueDetailPanel({
  issueId,
  boardId: propBoardId,
  columns,
  onClose,
}: {
  issueId: string
  boardId?: string
  columns: BoardColumn[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const { data: issue, isLoading, isError } = useQuery({
    queryKey: queryKeys.issues.detail(issueId),
    queryFn: () => issuesApi.get(issueId),
  })

  const effectiveBoardId = propBoardId ?? issue?.boardId ?? ''
  const { data: epics   = [] } = useEpics(effectiveBoardId)
  const { data: sprints = [] } = useSprints(effectiveBoardId)
  const { data: boardIssues } = useIssues(effectiveBoardId)

  const { data: commentsData } = useQuery({
    queryKey: queryKeys.issues.comments(issueId),
    queryFn: () => issuesApi.comments.list(issueId),
    enabled: !!issue,
  })

  const { data: activitiesData } = useQuery({
    queryKey: queryKeys.issues.activities(issueId),
    queryFn: () => issuesApi.activities.list(issueId),
    enabled: !!issue,
  })

  type TimelineEntry =
    | { kind: 'comment';  item: Comment;  at: number }
    | { kind: 'activity'; item: Activity; at: number }

  const timeline: TimelineEntry[] = [
    ...(commentsData?.content  ?? []).map((c): TimelineEntry => ({ kind: 'comment',  item: c, at: new Date(c.createdAt).getTime() })),
    ...(activitiesData?.content ?? []).map((a): TimelineEntry => ({ kind: 'activity', item: a, at: new Date(a.createdAt).getTime() })),
  ].sort((a, b) => a.at - b.at)

  const mutation = useMutation({
    mutationFn: (data: Partial<Issue>) => issuesApi.update(issueId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.issues.detail(issueId) })
      const prev = queryClient.getQueryData<Issue>(queryKeys.issues.detail(issueId))
      queryClient.setQueryData<Issue>(queryKeys.issues.detail(issueId), (old) => old ? { ...old, ...data } : old)
      return { prev }
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.issues.detail(issueId), ctx.prev)
      toast.error('Failed to update issue')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issueId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.activities(issueId) })
    },
  })

  const handleUpdate = useCallback((data: Partial<Issue>) => mutation.mutate(data), [mutation])

  return (
    <>
      <div
        className={cn(
          'fixed end-0 top-0 z-50 flex h-screen w-[680px] max-w-full flex-col',
          'border-s border-surface-border bg-surface shadow-2xl',
          'transition-transform duration-300 ease-out',
          visible ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
          </div>
        )}

        {isError && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-text-secondary">Failed to load issue.</p>
          </div>
        )}

        {issue && (
          <>
            {/* ── Header bar ── */}
            <div className="flex shrink-0 items-center gap-2 border-b border-surface-border px-5 py-2.5">
              <span className="font-mono text-xs font-semibold text-text-muted">{issue.issueKey}</span>
              <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', TYPE_CONFIG[issue.type].color)}>
                {TYPE_CONFIG[issue.type].label}
              </span>
              <div className="ms-auto flex items-center gap-1">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/issues/${issueId}`)
                    toast.success('Link copied')
                  }}
                  title="Copy link"
                  className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
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

            {/* ── Single scrollable column ── */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5">

                {/* Title */}
                <div className="mb-5">
                  <TitleEditor value={issue.title} onSave={(title) => handleUpdate({ title })} />
                </div>

                {/* Metadata grid */}
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
                      onSave={(columnId) => handleUpdate({ columnId })}
                    />
                  </MetaCell>

                  <MetaCell label="Priority">
                    <InlineSelect
                      value={issue.priority}
                      options={PRIORITIES as unknown as Issue['priority'][]}
                      renderValue={(v) => (
                        <span className="flex items-center gap-1.5">
                          <span className={cn('h-2 w-2 shrink-0 rounded-full', PRIORITY_CONFIG[v].dot)} />
                          {PRIORITY_CONFIG[v].label}
                        </span>
                      )}
                      renderOption={(v) => (
                        <span className="flex items-center gap-1.5">
                          <span className={cn('h-2 w-2 shrink-0 rounded-full', PRIORITY_CONFIG[v].dot)} />
                          {PRIORITY_CONFIG[v].label}
                        </span>
                      )}
                      onSave={(priority) => handleUpdate({ priority })}
                    />
                  </MetaCell>

                  <MetaCell label="Type">
                    <InlineSelect
                      value={issue.type}
                      options={ISSUE_TYPES as unknown as Issue['type'][]}
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
                      onSave={(type) => handleUpdate({ type })}
                    />
                  </MetaCell>

                  <MetaCell label="Epic">
                    <EpicSelect
                      value={issue.epicId ?? null}
                      epics={epics}
                      onSave={(epicId) => handleUpdate({ epicId } as Partial<Issue>)}
                    />
                  </MetaCell>

                  <MetaCell label="Sprint">
                    <SprintSelect
                      value={issue.sprintId ?? null}
                      sprints={sprints}
                      onSave={(sprintId) => handleUpdate({ sprintId } as Partial<Issue>)}
                    />
                  </MetaCell>

                  <MetaCell label="Assignee">
                    {issue.assigneeId ? (
                      <div className="flex items-center gap-1.5 px-1.5 py-1">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-[9px] font-bold text-primary">
                          {userInitials(issue.assigneeId)}
                        </div>
                        <span className="truncate font-mono text-xs text-text-secondary">{issue.assigneeId.slice(0, 8)}…</span>
                      </div>
                    ) : (
                      <span className="px-1.5 py-1 text-sm text-text-muted">Unassigned</span>
                    )}
                  </MetaCell>

                  <MetaCell label="Story points">
                    <StoryPointsField value={issue.storyPoints} onSave={(n) => handleUpdate({ storyPoints: n } as Partial<Issue>)} />
                  </MetaCell>

                  <MetaCell label="Reporter">
                    <div className="flex items-center gap-1.5 px-1.5 py-1">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-border text-[9px] font-bold text-text-secondary">
                        {userInitials(issue.reporterId)}
                      </div>
                      <span className="truncate font-mono text-xs text-text-secondary">{issue.reporterId.slice(0, 8)}…</span>
                    </div>
                  </MetaCell>

                  <MetaCell label="Start date">
                    <input
                      type="date"
                      value={toDateInput(issue.startDate)}
                      onChange={(e) => handleUpdate({ startDate: e.target.value ? new Date(e.target.value).toISOString() : null } as Partial<Issue>)}
                      className="w-full rounded-md border border-surface-border bg-surface px-2 py-1 text-xs text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </MetaCell>

                  <MetaCell label="Due date">
                    <input
                      type="date"
                      value={toDateInput(issue.dueDate)}
                      onChange={(e) => handleUpdate({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null } as Partial<Issue>)}
                      className={cn(
                        'w-full rounded-md border border-surface-border bg-surface px-2 py-1 text-xs text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20',
                        issue.dueDate && new Date(issue.dueDate) < new Date() && 'border-red-400 text-red-500',
                      )}
                    />
                  </MetaCell>

                  <MetaCell label="Created">
                    <span className="px-1.5 py-1 text-xs text-text-muted">{fmtDate(issue.createdAt)}</span>
                  </MetaCell>

                  {issue.parentIssueId && (() => {
                    const parent = boardIssues?.content.find((i) => i.id === issue.parentIssueId)
                    return (
                      <MetaCell label="Parent">
                        <span className="flex items-center gap-1.5 px-1.5 py-1 text-xs text-text-secondary">
                          <span className="font-mono text-text-muted">{parent?.issueKey ?? '…'}</span>
                          <span className="truncate">{parent?.title ?? issue.parentIssueId.slice(0, 8)}</span>
                        </span>
                      </MetaCell>
                    )
                  })()}

                </div>

                {/* Description */}
                <section className="mb-6">
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">Description</h2>
                  <DescriptionEditor
                    value={issue.description ?? ''}
                    onSave={(description) => handleUpdate({ description })}
                  />
                </section>

                {/* Child issues */}
                {(() => {
                  const children = boardIssues?.content.filter((i) => i.parentIssueId === issue.id) ?? []
                  if (children.length === 0) return null
                  return (
                    <section className="mb-6">
                      <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
                        Sub-tasks · {children.length}
                      </h2>
                      <div className="divide-y divide-surface-border/50 rounded-lg border border-surface-border">
                        {children.map((child) => (
                          <div
                            key={child.id}
                            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-surface-muted/50 first:rounded-t-lg last:rounded-b-lg"
                          >
                            <span className="font-mono text-[11px] text-text-muted">{child.issueKey}</span>
                            <span className="flex-1 truncate text-text-primary">{child.title}</span>
                            {child.completedAt && (
                              <span className="shrink-0 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-green-600">Done</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )
                })()}

                {/* Activity & Comments */}
                <section>
                  <div className="mb-3 flex items-center gap-3">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Activity</h2>
                    <div className="h-px flex-1 bg-surface-border" />
                    {(commentsData?.content?.length ?? 0) > 0 && (
                      <span className="rounded-full bg-surface-border px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                        {commentsData!.content.length} comment{commentsData!.content.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {timeline.length === 0 && (
                    <p className="py-4 text-center text-sm text-text-muted">No activity yet.</p>
                  )}

                  <div className="divide-y divide-surface-border/50">
                    {timeline.map((entry) =>
                      entry.kind === 'activity' ? (
                        <ActivityItem key={`a-${entry.item.id}`} activity={entry.item} />
                      ) : (
                        <CommentItem
                          key={`c-${entry.item.id}`}
                          comment={entry.item}
                          issueId={issueId}
                          currentUserId={user?.id}
                        />
                      )
                    )}
                  </div>

                  <AddCommentForm issueId={issueId} currentUser={user} />
                </section>

              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
