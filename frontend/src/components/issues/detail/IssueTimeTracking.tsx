import {useEffect, useMemo, useState} from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {Clock, Plus, Trash2} from 'lucide-react'
import {toast} from 'sonner'
import {issuesApi} from '@/api/issues'
import {usersApi} from '@/api/users'
import {queryKeys} from '@/api/queryKeys'
import {DatePicker} from '@/components/ui/DatePicker'
import {useAuthStore} from '@/stores/authStore'
import {cn} from '@/utils/cn'
import type {Issue} from '@/types/issue'
import type {UserProfile} from '@/types/board'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtHours(h: number | null | undefined) {
  if (h == null) return '—'
  return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

// ─── Inline estimate editor ────────────────────────────────────────────────────

function EstimateField({ value, onSave }: { value: number | null | undefined; onSave: (n: number | null) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value?.toString() ?? '')

  useEffect(() => { if (!editing) setDraft(value?.toString() ?? '') }, [value, editing])

  const commit = () => {
    const n = draft.trim() ? parseFloat(draft.trim()) : null
    onSave(isNaN(n ?? 0) ? null : n)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus type="number" min={0} step={0.5}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="w-16 rounded border border-primary bg-surface px-2 py-0.5 text-xs text-text-primary outline-none focus:ring-1 focus:ring-primary/20"
      />
    )
  }

  return (
    <button onClick={() => setEditing(true)} className="rounded px-1 py-0.5 text-xs hover:bg-surface-muted">
      {value != null
        ? <span className="font-semibold text-text-primary">{fmtHours(value)}</span>
        : <span className="text-text-muted">Set estimate</span>}
    </button>
  )
}

// ─── Log time form ─────────────────────────────────────────────────────────────

function LogTimeForm({ issueId, onDone }: { issueId: string; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [hours, setHours] = useState('')
  const [date, setDate] = useState(todayIso())
  const [desc, setDesc] = useState('')

  const mutation = useMutation({
    mutationFn: () => issuesApi.timelogs.create(issueId, {
      hoursSpent: parseFloat(hours),
      date: new Date(date + 'T12:00:00').toISOString(),
      description: desc.trim() || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.timelogs(issueId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issueId) })
      toast.success('Time logged')
      onDone()
    },
    onError: () => toast.error('Failed to log time'),
  })

  const valid = !!hours && parseFloat(hours) > 0

  return (
    <div className="mt-3 rounded-lg border border-surface-border bg-surface p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Hours</label>
          <input
            autoFocus
            type="number" min={0.1} step={0.5} placeholder="1.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-20 rounded border border-surface-border bg-surface-muted px-2 py-1.5 text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Date</label>
          <DatePicker
            value={date}
            onChange={(v) => setDate(v || todayIso())}
            placeholder="Today"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1 min-w-[120px]">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Note (optional)</label>
          <input
            type="text" placeholder="What did you work on?"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && valid) mutation.mutate() }}
            className="w-full rounded border border-surface-border bg-surface-muted px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => mutation.mutate()}
            disabled={!valid || mutation.isPending}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-light disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving…' : 'Log'}
          </button>
          <button
            onClick={onDone}
            className="rounded-md px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Public export ─────────────────────────────────────────────────────────────

export function IssueTimeTracking({ issue, onUpdate }: { issue: Issue; onUpdate: (data: Partial<Issue>) => void }) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [logging, setLogging] = useState(false)

  const { data: timelogs = [] } = useQuery({
    queryKey: queryKeys.issues.timelogs(issue.id),
    queryFn:  () => issuesApi.timelogs.list(issue.id),
  })

  const userIds = useMemo(() => [...new Set(timelogs.map(t => t.userId))], [timelogs])

  const { data: profiles = [] } = useQuery({
    queryKey: ['user-profiles', userIds],
    queryFn:  () => usersApi.batchGet(userIds),
    enabled:  userIds.length > 0,
  })

  const profileMap = useMemo(() => {
    const map = new Map<string, UserProfile>()
    profiles.forEach(p => map.set(p.id, p))
    return map
  }, [profiles])

  const totalSpent = useMemo(() => timelogs.reduce((sum, t) => sum + t.hoursSpent, 0), [timelogs])
  const estimated  = issue.estimatedHours
  const pct        = estimated && estimated > 0 ? Math.min(totalSpent / estimated, 1) : null
  const overBudget = estimated != null && totalSpent > estimated

  const deleteMutation = useMutation({
    mutationFn: (timeLogId: string) => issuesApi.timelogs.delete(issue.id, timeLogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.timelogs(issue.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issue.id) })
    },
    onError: () => toast.error('Failed to delete log'),
  })

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Time Tracking</h2>
        <div className="h-px flex-1 bg-surface-border" />
      </div>

      {/* Stats row */}
      <div className="mb-3 flex items-center gap-4 rounded-lg border border-surface-border bg-surface-muted/40 px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Clock className="h-3.5 w-3.5 text-text-muted" />
          <span>Estimate:</span>
          <EstimateField
            value={issue.estimatedHours}
            onSave={(n) => onUpdate({ estimatedHours: n } as Partial<Issue>)}
          />
        </div>
        <div className="text-xs text-text-secondary">
          Logged: <span className={cn('font-semibold', overBudget ? 'text-red-500' : 'text-text-primary')}>{fmtHours(totalSpent)}</span>
        </div>
        {estimated != null && (
          <div className="text-xs text-text-secondary">
            Remaining: <span className="font-semibold text-text-primary">{fmtHours(Math.max(0, estimated - totalSpent))}</span>
          </div>
        )}
        <button
          onClick={() => setLogging(v => !v)}
          className="ms-auto flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <Plus className="h-3 w-3" />
          Log time
        </button>
      </div>

      {/* Progress bar */}
      {pct !== null && (
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-border">
          <div
            className={cn('h-full rounded-full transition-all', overBudget ? 'bg-red-500' : 'bg-primary')}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      )}

      {/* Log time form */}
      {logging && <LogTimeForm issueId={issue.id} onDone={() => setLogging(false)} />}

      {/* Time log list */}
      {timelogs.length > 0 && (
        <div className="mt-3 divide-y divide-surface-border/50">
          {timelogs.map((log) => {
            const profile = profileMap.get(log.userId)
            const name = profile
              ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email
              : log.userId.slice(0, 8) + '…'
            const isOwn = log.userId === user?.id

            return (
              <div key={log.id} className="group flex items-center gap-3 py-2">
                <span className="min-w-[28px] text-center text-xs font-semibold text-primary">{fmtHours(log.hoursSpent)}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-text-primary">{name}</span>
                  {log.description && (
                    <span className="ms-1.5 text-xs text-text-secondary">· {log.description}</span>
                  )}
                </div>
                <span className="shrink-0 text-[11px] text-text-muted">{fmtDate(log.date)}</span>
                {isOwn && (
                  <button
                    onClick={() => deleteMutation.mutate(log.id)}
                    disabled={deleteMutation.isPending && deleteMutation.variables === log.id}
                    className="shrink-0 rounded p-1 text-text-muted opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 disabled:opacity-40"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {timelogs.length === 0 && !logging && (
        <p className="text-xs text-text-muted">No time logged yet.</p>
      )}
    </section>
  )
}
