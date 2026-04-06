import {useCallback, useEffect, useRef, useState} from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {AlertCircle, Link2, Loader2, Maximize2, Minimize2, Pencil, RotateCcw, X, XCircle} from 'lucide-react'
import {toast} from 'sonner'
import {issuesApi, useIssues} from '@/api/issues'
import {useEpics} from '@/api/epics'
import {useSprints} from '@/api/sprints'
import {useMilestones} from '@/api/milestones'
import {queryKeys} from '@/api/queryKeys'
import {useAuthStore} from '@/stores/authStore'
import {cn} from '@/utils/cn'
import {IssueTypeBadge} from '@/components/ui/Badge'
import {IssueMetaPanel} from './detail/IssueMetaPanel'
import {DescriptionEditor} from './detail/DescriptionEditor'
import {IssueTimeTracking} from './detail/IssueTimeTracking'
import {IssueActivity} from './detail/IssueActivity'
import {IssueAttachments} from './detail/IssueAttachments'
import type {Issue} from '@/types/issue'
import type {BoardColumn} from '@/types/board'

// ─── Title editor ─────────────────────────────────────────────────────────────

function TitleEditor({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select() } }, [editing])

  const startEditing = () => { setDraft(value); setEditing(true) }

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
      onClick={startEditing}
      className="group relative cursor-text rounded-md px-1 py-0.5 text-xl font-bold leading-snug text-text-primary hover:bg-surface-muted"
    >
      {value}
      <Pencil className="absolute inset-e-1 top-1.5 h-3.5 w-3.5 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
    </h1>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function IssueDetailPanel({
  issueId,
  boardId: propBoardId,
  columns,
  onClose,
  defaultFullScreen = false,
}: {
  issueId: string
  boardId?: string
  columns: BoardColumn[]
  onClose: () => void
  defaultFullScreen?: boolean
}) {
  const queryClient    = useQueryClient()
  const { user }       = useAuthStore()
  const [visible, setVisible] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(defaultFullScreen)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const { data: issue, isLoading, isError } = useQuery({
    queryKey: queryKeys.issues.detail(issueId),
    queryFn:  () => issuesApi.get(issueId),
  })

  const effectiveBoardId = propBoardId ?? issue?.boardId ?? ''
  const { data: epics      = [] } = useEpics(effectiveBoardId)
  const { data: sprints    = [] } = useSprints(effectiveBoardId)
  const { data: milestones = [] } = useMilestones(effectiveBoardId)
  const { data: boardIssues     } = useIssues(effectiveBoardId)

  const closeMutation = useMutation({
    mutationFn: (action: 'close' | 'reopen') =>
      action === 'close' ? issuesApi.close(issueId) : issuesApi.reopen(issueId),
    onSuccess: (updated) => {
      queryClient.setQueryData<Issue>(queryKeys.issues.detail(issueId), updated)
      if (effectiveBoardId) {
        void queryClient.invalidateQueries({ queryKey: ['issues', effectiveBoardId], exact: false })
      }
      toast.success(updated.closed ? 'Issue closed' : 'Issue reopened')
    },
    onError: () => toast.error('Failed to update issue status'),
  })

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
    onSettled: (_data, _err, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issueId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.activities(issueId) })
      if (effectiveBoardId) {
        void queryClient.invalidateQueries({ queryKey: ['issues', effectiveBoardId], exact: false })
        if ('sprintId' in variables) void queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all(effectiveBoardId) })
        if ('epicId'   in variables) void queryClient.invalidateQueries({ queryKey: queryKeys.epics.list(effectiveBoardId) })
      }
    },
  })

  const handleUpdate = useCallback((data: Partial<Issue>) => {
    if ('columnId' in data && data.columnId) {
      issuesApi.move(issueId, data.columnId, 0).then((updated) => {
        queryClient.setQueryData<Issue>(queryKeys.issues.detail(issueId), updated)
        if (effectiveBoardId) {
          void queryClient.invalidateQueries({ queryKey: ['issues', effectiveBoardId], exact: false })
        }
      }).catch(() => toast.error('Failed to move issue'))
      return
    }
    if ('assigneeId' in data) {
      issuesApi.assign(issueId, data.assigneeId ?? null).then((updated) => {
        queryClient.setQueryData<Issue>(queryKeys.issues.detail(issueId), updated)
        void queryClient.invalidateQueries({ queryKey: queryKeys.issues.activities(issueId) })
        if (effectiveBoardId) {
          void queryClient.invalidateQueries({ queryKey: ['issues', effectiveBoardId], exact: false })
        }
      }).catch(() => toast.error('Failed to update assignee'))
      return
    }
    mutation.mutate(data)
  }, [mutation, issueId, effectiveBoardId, queryClient])

  // Derived data for meta panel
  const parentIssue = issue?.parentIssueId
    ? boardIssues?.content.find((i) => i.id === issue.parentIssueId) ?? null
    : null
  const childIssues = boardIssues?.content.filter((i) => i.parentIssueId === issue?.id) ?? []

  return (
    <>
      {isFullScreen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    <div
      className={cn(
        'flex flex-col bg-surface border-s border-surface-border',
        isFullScreen
          ? 'fixed inset-y-0 end-0 z-50 w-full max-w-3xl shadow-2xl'
          : 'h-full w-full',
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
          {/* Header */}
          <div className="flex shrink-0 items-center gap-2 border-b border-surface-border px-5 py-2.5">
            <span className="font-mono text-xs font-semibold text-text-muted">{issue.issueKey}</span>
            <IssueTypeBadge type={issue.type} />
            {issue.closed && (
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                Closed
              </span>
            )}
            <div className="ms-auto flex items-center gap-1">
              <button
                onClick={() => {
                  const boardPath = effectiveBoardId ? `/boards/${effectiveBoardId}` : window.location.pathname
                  void navigator.clipboard.writeText(`${window.location.origin}${boardPath}?issue=${issueId}`)
                  toast.success('Link copied')
                }}
                title="Copy link"
                className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
              >
                <Link2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsFullScreen(v => !v)}
                title={isFullScreen ? 'Exit full screen' : 'Full screen'}
                className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
              >
                {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              {issue.closed ? (
                <button
                  onClick={() => closeMutation.mutate('reopen')}
                  disabled={closeMutation.isPending}
                  title="Reopen issue"
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-green-600 transition-colors hover:bg-green-500/10 disabled:opacity-50"
                >
                  {closeMutation.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <RotateCcw className="h-3.5 w-3.5" />
                  }
                  Reopen
                </button>
              ) : (
                <button
                  onClick={() => closeMutation.mutate('close')}
                  disabled={closeMutation.isPending}
                  title="Close issue"
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary disabled:opacity-50"
                >
                  {closeMutation.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <XCircle className="h-3.5 w-3.5" />
                  }
                  Close issue
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-5">

              <div className="mb-5">
                <TitleEditor value={issue.title} onSave={(title) => handleUpdate({ title })} />
              </div>

              <IssueMetaPanel
                issue={issue}
                boardId={effectiveBoardId}
                columns={columns}
                epics={epics}
                sprints={sprints}
                milestones={milestones}
                parentIssue={parentIssue}
                childIssues={childIssues}
                onUpdate={handleUpdate}
              />

              <section className="mb-6">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">Description</h2>
                <DescriptionEditor
                  value={issue.description ?? ''}
                  onSave={(description) => handleUpdate({ description })}
                />
              </section>

              <IssueTimeTracking issue={issue} onUpdate={handleUpdate} />

              <IssueAttachments issueId={issue.id} orgId={issue.orgId} />

              {childIssues.length > 0 && (
                <section className="mb-6">
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
                    Sub-tasks · {childIssues.length}
                  </h2>
                  <div className="divide-y divide-surface-border/50 rounded-lg border border-surface-border">
                    {childIssues.map((child) => (
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
              )}

              <IssueActivity issueId={issueId} currentUser={user} columns={columns} epics={epics} sprints={sprints} />

            </div>
          </div>
        </>
      )}
    </div>
    </>
  )
}
