import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bold, Italic, Code, List, GitCommitHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { issuesApi } from '@/api/issues'
import { queryKeys } from '@/api/queryKeys'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/utils/cn'
import type { Comment, Activity } from '@/types/issue'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
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

// ─── Markdown toolbar ─────────────────────────────────────────────────────────

function MdToolbar({
  textareaRef,
  setValue,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  setValue: (v: string) => void
}) {
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

// ─── Activity item ─────────────────────────────────────────────────────────────

function ActivityItem({ activity }: { activity: Activity }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted">
        <GitCommitHorizontal className="h-3.5 w-3.5 text-text-muted" />
      </div>
      <p className="flex-1 pt-0.5 text-xs text-text-secondary">
        <span className="font-medium text-text-primary">{activity.userId.slice(0, 2).toUpperCase()}</span>
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

// ─── Comment item ──────────────────────────────────────────────────────────────

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
      <Avatar userId={comment.userId} size="md" className="shrink-0" />
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

  const active = focused || draft.length > 0

  return (
    <div className="flex gap-3 pt-4">
      <Avatar
        userId={currentUser?.id}
        name={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : undefined}
        size="md"
        className="shrink-0"
      />
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

// ─── Public export ─────────────────────────────────────────────────────────────

interface IssueActivityProps {
  issueId: string
  currentUser: { id: string; firstName: string; lastName: string } | null
}

export function IssueActivity({ issueId, currentUser }: IssueActivityProps) {
  const { data: commentsData }   = useQuery({
    queryKey: queryKeys.issues.comments(issueId),
    queryFn:  () => issuesApi.comments.list(issueId),
  })
  const { data: activitiesData } = useQuery({
    queryKey: queryKeys.issues.activities(issueId),
    queryFn:  () => issuesApi.activities.list(issueId),
  })

  type TimelineEntry =
    | { kind: 'comment';  item: Comment;  at: number }
    | { kind: 'activity'; item: Activity; at: number }

  const timeline: TimelineEntry[] = [
    ...(commentsData?.content  ?? []).map((c): TimelineEntry => ({ kind: 'comment',  item: c, at: new Date(c.createdAt).getTime() })),
    ...(activitiesData?.content ?? []).map((a): TimelineEntry => ({ kind: 'activity', item: a, at: new Date(a.createdAt).getTime() })),
  ].sort((a, b) => a.at - b.at)

  const commentCount = commentsData?.content.length ?? 0

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Activity</h2>
        <div className="h-px flex-1 bg-surface-border" />
        {commentCount > 0 && (
          <span className="rounded-full bg-surface-border px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
            {commentCount} comment{commentCount !== 1 ? 's' : ''}
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
              currentUserId={currentUser?.id}
            />
          )
        )}
      </div>

      <AddCommentForm issueId={issueId} currentUser={currentUser} />
    </section>
  )
}
