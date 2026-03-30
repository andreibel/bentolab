import {useMemo, useState} from 'react'
import {useQueryClient} from '@tanstack/react-query'
import {toast} from 'sonner'
import {Minus, Plus, X, Zap} from 'lucide-react'
import {sprintsApi} from '@/api/sprints'
import {queryKeys} from '@/api/queryKeys'
import {cn} from '@/utils/cn'
import {MiniCalendar, toDatePart} from '@/components/ui/DatePicker'
import type {Sprint} from '@/types/sprint'

// ── Date helpers ───────────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const d = new Date(toDatePart(dateStr) + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function fmtDisplay(dateStr: string): string {
  return new Date(toDatePart(dateStr) + 'T12:00:00').toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

// ── Duration presets ───────────────────────────────────────────────────────────

const DURATION_PRESETS = [
  { label: '1W', days: 7  },
  { label: '2W', days: 14 },
  { label: '3W', days: 21 },
  { label: '4W', days: 28 },
] as const

// ── Main modal ─────────────────────────────────────────────────────────────────

export function CreateSprintModal({
  boardId,
  existingSprints = [],
  onClose,
}: {
  boardId: string
  existingSprints?: Sprint[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  // Smart defaults from existing sprints
  const suggestedStart = useMemo(() => {
    const nonCompleted = existingSprints.filter(s => s.endDate && s.status !== 'COMPLETED')
    if (nonCompleted.length === 0) return todayStr()
    const lastEnd = nonCompleted.map(s => s.endDate!).sort().at(-1)!
    return addDays(lastEnd, 1)
  }, [existingSprints])

  const nextNum = useMemo(() => {
    const nums = existingSprints.map(s => {
      const m = s.name.match(/(\d+)\s*$/)
      return m ? parseInt(m[1]) : 0
    })
    return Math.max(0, ...nums) + 1
  }, [existingSprints])

  const [count,      setCount]      = useState(1)
  const [prefix,     setPrefix]     = useState('Sprint')
  const [startNum,   setStartNum]   = useState(nextNum)
  const [durDays,    setDurDays]    = useState(14)
  const [customDays, setCustomDays] = useState('')
  const [useCustom,  setUseCustom]  = useState(false)
  const [startDate,  setStartDate]  = useState(suggestedStart)
  const [goal,       setGoal]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  const effectiveDuration = useCustom ? (parseInt(customDays) || durDays) : durDays

  const previewSprints = useMemo(() => {
    const result: { name: string; startDate: string; endDate: string }[] = []
    let cur = startDate
    for (let i = 0; i < count; i++) {
      const end = addDays(cur, effectiveDuration - 1)
      result.push({ name: `${prefix} ${startNum + i}`, startDate: cur, endDate: end })
      cur = addDays(end, 1)
    }
    return result
  }, [count, prefix, startNum, startDate, effectiveDuration])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prefix.trim()) return
    setSubmitting(true)
    try {
      for (const s of previewSprints) {
        await sprintsApi.create({
          boardId,
          name:      s.name,
          goal:      goal.trim() || undefined,
          startDate: new Date(s.startDate + 'T12:00:00').toISOString(),
          endDate:   new Date(s.endDate   + 'T12:00:00').toISOString(),
        })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all(boardId) })
      toast.success(count === 1 ? 'Sprint created' : `${count} sprints created`)
      onClose()
    } catch {
      toast.error('Failed to create sprints')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-[560px] max-h-[92vh] overflow-y-auto rounded-2xl border border-surface-border bg-surface shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-border bg-surface px-5 py-4">
          <h2 className="text-base font-semibold text-text-primary">Create Sprints</h2>
          <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-surface-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">

          {/* Count + Name prefix + Starting # */}
          <div className="flex items-end gap-3">
            <div className="shrink-0">
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Sprints to create</label>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setCount(c => Math.max(1, c - 1))}
                  disabled={count <= 1}
                  className="rounded-lg border border-surface-border p-1.5 text-text-muted transition-colors hover:bg-surface-muted disabled:opacity-30">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-semibold text-text-primary">{count}</span>
                <button type="button" onClick={() => setCount(c => Math.min(10, c + 1))}
                  disabled={count >= 10}
                  className="rounded-lg border border-surface-border p-1.5 text-text-muted transition-colors hover:bg-surface-muted disabled:opacity-30">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Name prefix</label>
              <input
                value={prefix}
                onChange={e => setPrefix(e.target.value)}
                autoFocus
                className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <div className="shrink-0">
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Starting #</label>
              <input
                type="number" min={1} value={startNum}
                onChange={e => setStartNum(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Duration presets */}
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-text-muted" />
              <label className="text-xs font-medium text-text-muted">Sprint duration</label>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {DURATION_PRESETS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { setDurDays(p.days); setUseCustom(false) }}
                  className={cn(
                    'rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors',
                    !useCustom && durDays === p.days
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-surface-border text-text-muted hover:border-primary/40 hover:text-text-primary',
                  )}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUseCustom(v => !v)}
                className={cn(
                  'rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors',
                  useCustom
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-surface-border text-text-muted hover:border-primary/40 hover:text-text-primary',
                )}
              >
                Custom
              </button>
              {useCustom && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min={1} max={90} value={customDays}
                    onChange={e => setCustomDays(e.target.value)}
                    placeholder="14"
                    className="w-14 rounded-lg border border-surface-border bg-surface-muted px-2 py-1.5 text-xs text-text-primary outline-none focus:border-primary"
                  />
                  <span className="text-xs text-text-muted">days</span>
                </div>
              )}
            </div>
          </div>

          {/* Start date calendar */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-muted">First sprint starts</label>
            <MiniCalendar value={startDate} onChange={setStartDate} />
          </div>

          {/* Preview */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-muted">
              Preview — {count} sprint{count !== 1 ? 's' : ''}
            </label>
            <div className="overflow-hidden rounded-xl border border-surface-border divide-y divide-surface-border">
              {previewSprints.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-surface-muted px-4 py-2.5">
                  <span className="text-xs font-medium text-text-primary">{s.name}</span>
                  <span className="text-xs text-text-muted">{fmtDisplay(s.startDate)} → {fmtDisplay(s.endDate)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">
              Goal{count > 1 ? ' (applied to all)' : ' (optional)'}
            </label>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="What do you want to achieve in this sprint?"
              rows={2}
              className="w-full resize-none rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-text-muted hover:text-text-primary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !prefix.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50"
            >
              {submitting ? 'Creating…' : count === 1 ? 'Create Sprint' : `Create ${count} Sprints`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}