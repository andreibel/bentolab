import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useForm, Controller } from 'react-hook-form'
import {
  X, Maximize2, Minimize2,
  Bug, BookOpen, CheckSquare, Zap,
  ArrowUp, ArrowDown, Minus, GripHorizontal,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { issuesApi, useIssues } from '@/api/issues'
import { useBoards, useBoard } from '@/api/boards'
import { useEpics } from '@/api/epics'
import { useSprints } from '@/api/sprints'
import { queryKeys } from '@/api/queryKeys'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'
import type { IssueType, IssuePriority } from '@/types/issue'

// ── Config ────────────────────────────────────────────────────────────────────

const TYPES = [
  { value: 'STORY'   as IssueType, label: 'Story',   icon: <BookOpen    className="h-3.5 w-3.5" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { value: 'TASK'    as IssueType, label: 'Task',    icon: <CheckSquare className="h-3.5 w-3.5" />, color: 'text-blue-500',    bg: 'bg-blue-500/10'    },
  { value: 'BUG'     as IssueType, label: 'Bug',     icon: <Bug         className="h-3.5 w-3.5" />, color: 'text-red-500',     bg: 'bg-red-500/10'     },
  { value: 'SUBTASK' as IssueType, label: 'Sub',     icon: <Zap         className="h-3.5 w-3.5" />, color: 'text-yellow-500',  bg: 'bg-yellow-500/10'  },
]

const PRIORITIES = [
  { value: 'CRITICAL' as IssuePriority, label: 'Critical', icon: <ArrowUp   className="h-3 w-3" />, color: 'text-red-500'    },
  { value: 'HIGH'     as IssuePriority, label: 'High',     icon: <ArrowUp   className="h-3 w-3" />, color: 'text-orange-500' },
  { value: 'MEDIUM'   as IssuePriority, label: 'Medium',   icon: <Minus     className="h-3 w-3" />, color: 'text-yellow-500' },
  { value: 'LOW'      as IssuePriority, label: 'Low',      icon: <ArrowDown className="h-3 w-3" />, color: 'text-blue-400'   },
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormValues {
  type:          IssueType
  priority:      IssuePriority
  title:         string
  description:   string
  boardId:       string
  columnId:      string
  epicId:        string
  sprintId:      string
  parentIssueId: string
  storyPoints:   string
  dueDate:       string
}

export interface CreateIssueModalProps {
  open:       boolean
  onClose:    () => void
  boardId?:   string
  boardKey?:  string
  boardName?: string
  columnId?:  string
  sprintId?:  string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      {children}
    </div>
  )
}

function NativeSelect({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-lg border border-surface-border bg-surface-muted px-2.5 py-1.5 text-sm text-text-primary',
        'outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors',
        className,
      )}
      {...props}
    />
  )
}

// ── Drag hook ─────────────────────────────────────────────────────────────────

function useDraggable() {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const origin = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    // Only drag on left click on the handle itself, not buttons inside it
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('button')) return
    isDragging.current = true
    origin.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDragging.current) return
    setOffset({
      x: origin.current.ox + (e.clientX - origin.current.mx),
      y: origin.current.oy + (e.clientY - origin.current.my),
    })
  }

  const onPointerUp = () => { isDragging.current = false }

  return { offset, onPointerDown, onPointerMove, onPointerUp }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateIssueModal({
  open,
  onClose,
  boardId:   propBoardId,
  boardKey:  propBoardKey,
  boardName: propBoardName,
  columnId:  propColumnId,
  sprintId:  propSprintId,
}: CreateIssueModalProps) {
  const queryClient = useQueryClient()
  const [fullScreen, setFullScreen] = useState(false)
  const drag = useDraggable()

  const isGlobalMode = !propBoardId

  const { data: allBoards } = useBoards()

  const {
    register, control, handleSubmit, watch, setValue, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      type: 'TASK', priority: 'MEDIUM',
      title: '', description: '',
      boardId: propBoardId ?? '', columnId: propColumnId ?? '',
      epicId: '', sprintId: propSprintId ?? '', parentIssueId: '', storyPoints: '', dueDate: '',
    },
  })

  const watchedBoardId   = watch('boardId')
  const effectiveBoardId = propBoardId ?? watchedBoardId

  const { data: boardData }      = useBoard(effectiveBoardId || '')
  const { data: issuesPage }     = useIssues(effectiveBoardId || '')
  const { data: epicsData   = [] } = useEpics(effectiveBoardId || '')
  const { data: sprintsData = [] } = useSprints(effectiveBoardId || '')
  const columns   = [...(boardData?.columns ?? [])].sort((a, b) => a.position - b.position)
  const allIssues = issuesPage?.content ?? []

  useEffect(() => {
    if (!isGlobalMode || !columns.length) return
    const initial = columns.find((c) => c.isInitial) ?? columns[0]
    setValue('columnId', initial?.id ?? '')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveBoardId, isGlobalMode, setValue])

  useEffect(() => {
    if (!open) return
    reset({
      type: 'TASK', priority: 'MEDIUM',
      title: '', description: '',
      boardId: propBoardId ?? '', columnId: propColumnId ?? '',
      epicId: '', sprintId: propSprintId ?? '', parentIssueId: '', storyPoints: '', dueDate: '',
    })
    setFullScreen(false)
  }, [open, propBoardId, propColumnId, reset])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const onSubmit = async (values: FormValues) => {
    let resolvedBoardKey = propBoardKey
    if (!resolvedBoardKey) {
      const picked = allBoards?.find((b) => b.id === values.boardId)
      if (!picked) { toast.error('Please select a board'); return }
      resolvedBoardKey = picked.boardKey
    }

    let resolvedColumnId = values.columnId
    if (!resolvedColumnId && columns.length) {
      resolvedColumnId = (columns.find((c) => c.isInitial) ?? columns[0])?.id ?? ''
    }

    try {
      await issuesApi.create({
        boardId:     effectiveBoardId,
        boardKey:    resolvedBoardKey!,
        title:       values.title.trim(),
        type:        values.type,
        priority:    values.priority,
        description: values.description.trim() || undefined,
        columnId:      resolvedColumnId        || undefined,
        epicId:        values.epicId           || undefined,
        sprintId:      values.sprintId         || undefined,
        parentIssueId: values.parentIssueId    || undefined,
        storyPoints:   values.storyPoints ? Number(values.storyPoints) : undefined,
        dueDate:       values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
      })

      queryClient.invalidateQueries({ queryKey: ['issues', effectiveBoardId], exact: false })
      toast.success('Issue created')
      onClose()
    } catch {
      toast.error('Failed to create issue')
    }
  }

  const selectedType     = watch('type')
  const selectedPriority = watch('priority')
  const typeInfo         = TYPES.find((t) => t.value === selectedType)!
  const priorityInfo     = PRIORITIES.find((p) => p.value === selectedPriority)!

  if (!open) return null

  // ── Shared header ──────────────────────────────────────────────────────────
  const header = (
    <div
      className={cn(
        'flex shrink-0 items-center gap-2 border-b border-surface-border px-4 py-3',
        !fullScreen && 'cursor-grab active:cursor-grabbing select-none',
      )}
      onPointerDown={!fullScreen ? drag.onPointerDown : undefined}
      onPointerMove={!fullScreen ? drag.onPointerMove : undefined}
      onPointerUp={!fullScreen ? drag.onPointerUp    : undefined}
    >
      {!fullScreen && (
        <GripHorizontal className="h-4 w-4 shrink-0 text-text-muted" />
      )}
      <span className="flex-1 text-sm font-semibold text-text-primary">Create issue</span>
      <button
        type="button"
        onClick={() => setFullScreen((f) => !f)}
        className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
        title={fullScreen ? 'Compact view' : 'Full screen'}
      >
        {fullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )

  // ── Shared footer ──────────────────────────────────────────────────────────
  const footer = (
    <div className="flex shrink-0 items-center justify-between border-t border-surface-border px-5 py-3">
      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <span className={cn('font-medium', typeInfo.color)}>{typeInfo.label}</span>
        <span>·</span>
        <span className={priorityInfo.color}>{priorityInfo.label}</span>
        {propBoardName && (
          <>
            <span>·</span>
            <span>{propBoardName}</span>
          </>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>Create issue</Button>
      </div>
    </div>
  )

  // ── Full-screen mode: modal with backdrop ──────────────────────────────────
  if (fullScreen) {
    return createPortal(
      <>
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="fixed inset-2 z-50 flex flex-col rounded-2xl border border-surface-border bg-surface shadow-2xl">
          {header}
          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1">
              {/* Left — title + description */}
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
                <TypePicker control={control} />
                <div>
                  <textarea
                    {...register('title', { required: 'Title is required' })}
                    placeholder="Issue title"
                    rows={2}
                    autoFocus
                    className={cn(
                      'w-full resize-none rounded-lg border bg-surface-muted px-3 py-2.5 text-base font-medium',
                      'text-text-primary placeholder:text-text-muted outline-none transition-colors',
                      'focus:border-primary/50 focus:ring-1 focus:ring-primary/20',
                      errors.title ? 'border-red-400' : 'border-surface-border',
                    )}
                  />
                  {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
                </div>
                <textarea
                  {...register('description')}
                  placeholder="Add a description… (optional)"
                  rows={10}
                  className="w-full flex-1 resize-none rounded-lg border border-surface-border bg-surface-muted px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </div>

              {/* Right — metadata */}
              <div className="flex w-60 shrink-0 flex-col gap-4 overflow-y-auto border-s border-surface-border p-5">
                <Field label="Priority"><PriorityPicker control={control} /></Field>

                {isGlobalMode && (
                  <Field label="Board">
                    <NativeSelect {...register('boardId', { required: true })}>
                      <option value="">Select board…</option>
                      {allBoards?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </NativeSelect>
                  </Field>
                )}
                {!isGlobalMode && propBoardName && (
                  <Field label="Board"><p className="text-sm text-text-secondary">{propBoardName}</p></Field>
                )}
                {columns.length > 0 && (
                  <Field label="Column">
                    <NativeSelect {...register('columnId')}>
                      {columns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </NativeSelect>
                  </Field>
                )}
                {epicsData.length > 0 && (
                  <Field label="Epic">
                    <NativeSelect {...register('epicId')}>
                      <option value="">None</option>
                      {epicsData.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </NativeSelect>
                  </Field>
                )}
                {sprintsData.filter((s) => s.status !== 'COMPLETED').length > 0 && (
                  <Field label="Sprint">
                    <NativeSelect {...register('sprintId')}>
                      <option value="">Backlog</option>
                      {sprintsData.filter((s) => s.status !== 'COMPLETED').map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </NativeSelect>
                  </Field>
                )}
                {allIssues.length > 0 && (
                  <Field label="Parent issue">
                    <NativeSelect {...register('parentIssueId')}>
                      <option value="">None</option>
                      {allIssues.map((i) => <option key={i.id} value={i.id}>{i.issueKey} · {i.title}</option>)}
                    </NativeSelect>
                  </Field>
                )}
                <Field label="Story points">
                  <input
                    {...register('storyPoints')}
                    type="number" min={0} placeholder="—"
                    className="w-full rounded-lg border border-surface-border bg-surface-muted px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                  />
                </Field>
                <Field label="Due date">
                  <input
                    {...register('dueDate')}
                    type="date"
                    className="w-full rounded-lg border border-surface-border bg-surface-muted px-2.5 py-1.5 text-sm text-text-primary outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                  />
                </Field>
              </div>
            </div>
            {footer}
          </form>
        </div>
      </>,
      document.body
    )
  }

  // ── Compact mode: floating draggable panel, NO backdrop ────────────────────
  return createPortal(
    <div
      style={{ transform: `translate(${drag.offset.x}px, ${drag.offset.y}px)` }}
      className="fixed bottom-4 end-4 z-50 flex w-[460px] flex-col rounded-2xl border border-surface-border bg-surface shadow-2xl"
    >
      {header}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <div className="flex flex-col gap-4 p-5">
          <TypePicker control={control} />
          <Input
            placeholder="Issue title"
            autoFocus
            error={errors.title?.message}
            {...register('title', { required: 'Title is required' })}
          />
          <Field label="Priority">
            <PriorityPicker control={control} />
          </Field>
          {isGlobalMode && (
            <Field label="Board">
              <NativeSelect {...register('boardId', { required: true })}>
                <option value="">Select board…</option>
                {allBoards?.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </NativeSelect>
            </Field>
          )}
        </div>
        {footer}
      </form>
    </div>,
    document.body
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TypePicker({ control }: { control: Parameters<typeof Controller>[0]['control'] }) {
  return (
    <Controller
      name="type"
      control={control}
      render={({ field }) => (
        <div className="flex gap-1">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => field.onChange(t.value)}
              title={t.label}
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors',
                field.value === t.value
                  ? `${t.color} ${t.bg}`
                  : 'text-text-muted hover:bg-surface-muted hover:text-text-primary',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      )}
    />
  )
}

function PriorityPicker({ control }: { control: Parameters<typeof Controller>[0]['control'] }) {
  return (
    <Controller
      name="priority"
      control={control}
      render={({ field }) => (
        <div className="flex flex-wrap gap-1">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => field.onChange(p.value)}
              className={cn(
                'flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors',
                field.value === p.value
                  ? `${p.color} bg-current/10`
                  : 'text-text-muted hover:bg-surface-muted',
              )}
            >
              <span className={field.value === p.value ? p.color : ''}>{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>
      )}
    />
  )
}
