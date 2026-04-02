import {useCallback, useMemo, useRef, useState} from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {Bold, ChevronDown, Code, GitCommitHorizontal, Italic, List, Pencil, Trash2} from 'lucide-react'
import {marked} from 'marked'
import {toast} from 'sonner'
import {issuesApi} from '@/api/issues'
import {usersApi} from '@/api/users'
import {queryKeys} from '@/api/queryKeys'
import {Avatar} from '@/components/ui/Avatar'
import {sanitizeHtml} from '@/utils/sanitize'
import {cn} from '@/utils/cn'
import type {Activity, Comment} from '@/types/issue'
import type {BoardColumn, UserProfile} from '@/types/board'
import type {Epic} from '@/types/epic'
import type {Sprint} from '@/types/sprint'

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
  return sanitizeHtml(marked.parse(text, { async: false }) as string)
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

function MdToolbar({ onWrap }: { onWrap: (prefix: string, suffix?: string) => void }) {
  return (
    <div className="flex items-center gap-0.5 px-1.5 py-1">
      {([
        { icon: Bold,   tip: 'Bold',   prefix: '**',   suffix: undefined as string | undefined },
        { icon: Italic, tip: 'Italic', prefix: '*',    suffix: undefined as string | undefined },
        { icon: Code,   tip: 'Code',   prefix: '`',    suffix: undefined as string | undefined },
        { icon: List,   tip: 'List',   prefix: '\n- ', suffix: ''                              },
      ] as const).map(({ icon: Icon, tip, prefix, suffix }) => (
        <button
          key={tip}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onWrap(prefix, suffix) }}
          title={tip}
          className="rounded p-1 text-text-muted hover:bg-surface-border hover:text-text-primary"
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  )
}

// ─── Activity formatter ────────────────────────────────────────────────────────

function resolveValue(
  val: unknown,
  profileMap: Map<string, UserProfile>,
  columns: BoardColumn[],
  epics: Epic[],
  sprints: Sprint[],
): string {
  if (val == null) return '—'
  if (typeof val !== 'string') return String(val)
  const col = columns.find(c => c.id === val)
  if (col) return col.name
  const epic = epics.find(e => e.id === val)
  if (epic) return epic.title
  const sprint = sprints.find(s => s.id === val)
  if (sprint) return sprint.name
  const profile = profileMap.get(val)
  if (profile) return [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email
  return val
}

function formatActivityMessage(
  activity: Activity,
  profileMap: Map<string, UserProfile>,
  columns: BoardColumn[],
  epics: Epic[],
  sprints: Sprint[],
) {
  const action  = activity.action.toUpperCase()
  const details = activity.details ?? {}
  // Backend sends: { field, oldValue, newValue, metadata }
  const newRaw  = details.newValue != null ? details.newValue : null
  const oldRaw  = details.oldValue != null ? details.oldValue : null
  const field   = typeof details.field === 'string' ? details.field.toLowerCase() : ''
  const newVal  = newRaw != null ? resolveValue(newRaw, profileMap, columns, epics, sprints) : null
  const oldVal  = oldRaw != null ? resolveValue(oldRaw, profileMap, columns, epics, sprints) : null
  const B = (t: string) => <span className="font-medium text-text-primary">{t}</span>

  switch (action) {
    case 'MOVED':
    case 'COLUMN_CHANGED':
      if (oldVal && newVal) return <>moved from {B(oldVal)} to {B(newVal)}</>
      if (newVal)           return <>moved to {B(newVal)}</>
      return <>moved this issue</>

    case 'ASSIGNED':
      if (newVal) return <>assigned to {B(newVal)}</>
      return <>unassigned this issue</>

    case 'SPRINT_CHANGED':
      if (!newRaw)            return <>moved to backlog</>
      if (oldVal && newVal)   return <>changed sprint from {B(oldVal)} to {B(newVal)}</>
      if (newVal)             return <>added to sprint {B(newVal)}</>
      return <>changed sprint</>

    case 'EPIC_CHANGED':
      if (!newRaw)            return <>removed epic</>
      if (oldVal && newVal)   return <>changed epic from {B(oldVal)} to {B(newVal)}</>
      if (newVal)             return <>added to epic {B(newVal)}</>
      return <>changed epic</>

    case 'UPDATED': {
      if (field === 'priority') {
        if (oldVal && newVal) return <>changed priority from {B(oldVal)} to {B(newVal)}</>
        if (newVal)           return <>changed priority to {B(newVal)}</>
      }
      if (field === 'type') {
        if (oldVal && newVal) return <>changed type from {B(oldVal)} to {B(newVal)}</>
        if (newVal)           return <>changed type to {B(newVal)}</>
      }
      if (field === 'title')       return <>changed title</>
      if (field === 'description') return <>updated description</>
      // cspell:ignore storypoints duedate startdate
      if (field === 'storypoints' || field === 'story_points') {
        if (newVal) return <>changed story points to {B(newVal)}</>
        return <>changed story points</>
      }
      if (field === 'duedate' || field === 'due_date') {
        if (newVal) return <>set due date to {B(newVal)}</>
        return <>removed due date</>
      }
      if (field === 'startdate' || field === 'start_date') {
        if (newVal) return <>set start date to {B(newVal)}</>
        return <>removed start date</>
      }
      if (field && newVal) return <>changed {B(field)} to {B(newVal)}</>
      if (field)           return <>changed {B(field)}</>
      return <>updated</>
    }

    case 'CLOSED':   return <>closed this issue</>
    case 'REOPENED': return <>reopened this issue</>
    case 'CREATED':  return <>created this issue</>
    case 'COMMENTED': return <>commented</>

    default: {
      const readable = activity.action.toLowerCase().replace(/_/g, ' ')
      return newVal ? <>{readable} → {B(newVal)}</> : <>{readable}</>
    }
  }
}

// ─── Activity item ─────────────────────────────────────────────────────────────

function ActivityItem({
  activity,
  profileMap,
  columns,
  epics,
  sprints,
}: {
  activity: Activity
  profileMap: Map<string, UserProfile>
  columns: BoardColumn[]
  epics: Epic[]
  sprints: Sprint[]
}) {
  const profile = profileMap.get(activity.userId)
  const name = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email
    : activity.userId.slice(0, 8) + '…'

  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted">
        <GitCommitHorizontal className="h-3.5 w-3.5 text-text-muted" />
      </div>
      <p className="flex-1 pt-0.5 text-xs text-text-secondary">
        <span className="font-medium text-text-primary">{name}</span>
        {' '}
        {formatActivityMessage(activity, profileMap, columns, epics, sprints)}
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
  profileMap,
}: {
  comment: Comment
  issueId: string
  currentUserId: string | undefined
  profileMap: Map<string, UserProfile>
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.text)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isOwn = comment.userId === currentUserId

  const wrap = useCallback((prefix: string, suffix = prefix) => {
    const el = textareaRef.current
    if (el) insertMdAt(el, setDraft, prefix, suffix)
  }, [])
  const commentProfile = profileMap.get(comment.userId)
  const commentAuthorName = commentProfile
    ? [commentProfile.firstName, commentProfile.lastName].filter(Boolean).join(' ') || commentProfile.email
    : comment.userId.slice(0, 8) + '…'

  const editMutation = useMutation({
    mutationFn: (text: string) => issuesApi.comments.update(issueId, comment.id, text),
    onSuccess: () => {
      setEditing(false)
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.comments(issueId) })
    },
    onError: () => toast.error('Failed to update comment'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => issuesApi.comments.delete(issueId, comment.id),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: queryKeys.issues.comments(issueId) }) },
    onError: () => toast.error('Failed to delete comment'),
  })

  return (
    <div className="group flex items-start gap-3 py-3">
      <Avatar userId={comment.userId} size="md" className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">{commentAuthorName}</span>
          <span className="text-xs text-text-muted">{timeAgo(comment.createdAt)}</span>
          {comment.isEdited && <span className="text-xs text-text-muted">(edited)</span>}
        </div>

        {editing ? (
          <div>
            <div className="rounded-t-md border border-b-0 border-surface-border bg-surface-muted">
              <MdToolbar onWrap={wrap} />
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

  const wrap = useCallback((prefix: string, suffix = prefix) => {
    const el = textareaRef.current
    if (el) insertMdAt(el, setDraft, prefix, suffix)
  }, [])

  const addMutation = useMutation({
    mutationFn: (text: string) => issuesApi.comments.create(issueId, text),
    onSuccess: () => {
      setDraft(''); setFocused(false)
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.comments(issueId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.activities(issueId) })
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
            <MdToolbar onWrap={wrap} />
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
  columns: BoardColumn[]
  epics: Epic[]
  sprints: Sprint[]
}

const ACTIVITY_PREVIEW = 5

export function IssueActivity({ issueId, currentUser, columns, epics, sprints }: IssueActivityProps) {
  const [showAll, setShowAll] = useState(false)
  const { data: commentsData }   = useQuery({
    queryKey: queryKeys.issues.comments(issueId),
    queryFn:  () => issuesApi.comments.list(issueId),
  })
  const { data: activitiesData } = useQuery({
    queryKey: queryKeys.issues.activities(issueId),
    queryFn:  () => issuesApi.activities.list(issueId),
  })

  const allUserIds = useMemo(() => {
    const ids = new Set<string>()
    activitiesData?.content.forEach(a => ids.add(a.userId))
    commentsData?.content.forEach(c => ids.add(c.userId))
    return [...ids]
  }, [activitiesData, commentsData])

  const { data: profiles = [] } = useQuery({
    queryKey: ['user-profiles', allUserIds],
    queryFn:  () => usersApi.batchGet(allUserIds),
    enabled:  allUserIds.length > 0,
  })

  const profileMap = useMemo(() => {
    const map = new Map<string, UserProfile>()
    profiles.forEach(p => map.set(p.id, p))
    return map
  }, [profiles])

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

      {(() => {
        const hidden = timeline.length - ACTIVITY_PREVIEW
        const visible = showAll ? timeline : timeline.slice(-ACTIVITY_PREVIEW)
        return (
          <>
            {!showAll && hidden > 0 && (
              <button
                onClick={() => setShowAll(true)}
                className="mb-1 flex w-full items-center gap-2 rounded-md py-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                Show {hidden} earlier {hidden === 1 ? 'entry' : 'entries'}
              </button>
            )}
            <div className="divide-y divide-surface-border/50">
              {visible.map((entry) =>
                entry.kind === 'activity' ? (
                  <ActivityItem key={`a-${entry.item.id}`} activity={entry.item} profileMap={profileMap} columns={columns} epics={epics} sprints={sprints} />
                ) : (
                  <CommentItem
                    key={`c-${entry.item.id}`}
                    comment={entry.item}
                    issueId={issueId}
                    currentUserId={currentUser?.id}
                    profileMap={profileMap}
                  />
                )
              )}
            </div>
            {showAll && hidden > 0 && (
              <button
                onClick={() => setShowAll(false)}
                className="mt-1 flex w-full items-center gap-2 rounded-md py-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
              >
                <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                Show less
              </button>
            )}
          </>
        )
      })()}

      <AddCommentForm issueId={issueId} currentUser={currentUser} />
    </section>
  )
}
