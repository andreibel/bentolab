import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Link2, AlertCircle, Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { issuesApi, useIssues } from '@/api/issues'
import { useEpics } from '@/api/epics'
import { useSprints } from '@/api/sprints'
import { queryKeys } from '@/api/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils/cn'
import { IssueTypeBadge } from '@/components/ui/Badge'
import { IssueMetaPanel } from './detail/IssueMetaPanel'
import { DescriptionEditor } from './detail/DescriptionEditor'
import { IssueActivity } from './detail/IssueActivity'
import type { Issue } from '@/types/issue'
import type { BoardColumn } from '@/types/board'

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
  const queryClient    = useQueryClient()
  const { user }       = useAuthStore()
  const [visible, setVisible] = useState(false)

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
  const { data: epics   = [] } = useEpics(effectiveBoardId)
  const { data: sprints = [] } = useSprints(effectiveBoardId)
  const { data: boardIssues  } = useIssues(effectiveBoardId)

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
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issueId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.activities(issueId) })
      if (effectiveBoardId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(effectiveBoardId) })
        if ('sprintId' in variables) queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all(effectiveBoardId) })
        if ('epicId'   in variables) queryClient.invalidateQueries({ queryKey: queryKeys.epics.list(effectiveBoardId) })
      }
    },
  })

  const handleUpdate = useCallback((data: Partial<Issue>) => mutation.mutate(data), [mutation])

  // Derived data for meta panel
  const parentIssue = issue?.parentIssueId
    ? boardIssues?.content.find((i) => i.id === issue.parentIssueId) ?? null
    : null
  const childIssues = boardIssues?.content.filter((i) => i.parentIssueId === issue?.id) ?? []

  return (
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
          {/* Header */}
          <div className="flex shrink-0 items-center gap-2 border-b border-surface-border px-5 py-2.5">
            <span className="font-mono text-xs font-semibold text-text-muted">{issue.issueKey}</span>
            <IssueTypeBadge type={issue.type} />
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

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-5">

              <div className="mb-5">
                <TitleEditor value={issue.title} onSave={(title) => handleUpdate({ title })} />
              </div>

              <IssueMetaPanel
                issue={issue}
                columns={columns}
                epics={epics}
                sprints={sprints}
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

              <IssueActivity issueId={issueId} currentUser={user} />

            </div>
          </div>
        </>
      )}
    </div>
  )
}
