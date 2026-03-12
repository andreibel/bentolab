import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, ArrowLeft, Check } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { boardsApi } from '@/api/boards'
import { queryKeys } from '@/api/queryKeys'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ColorPicker } from '@/components/common/ColorPicker'
import { cn } from '@/utils/cn'
import type { Board } from '@/types/board'

// ─── Template definitions ─────────────────────────────────────────────────────

type BoardType = Board['boardType']

const TEMPLATES: {
  type: BoardType
  label: string
  description: string
  illustration: string
}[] = [
  {
    type: 'SCRUM',
    label: 'Scrum',
    description: 'Sprint-based delivery with backlog, velocity tracking, and burndown charts.',
    illustration: '/illustrations/scrum.svg',
  },
  {
    type: 'KANBAN',
    label: 'Kanban',
    description: 'Continuous flow with WIP limits to keep your team focused and unblocked.',
    illustration: '/illustrations/kanban.svg',
  },
  {
    type: 'BUG_TRACKING',
    label: 'Bug Tracking',
    description: 'Triage, prioritize, and resolve issues with severity and status tracking.',
    illustration: '/illustrations/bug-tracking.svg',
  },
  {
    type: 'CUSTOM',
    label: 'Custom',
    description: 'Start from scratch and build your workflow exactly how you need it.',
    illustration: '/illustrations/custom.svg',
  },
]

const BOARD_COLORS = [
  '#5B47E0', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#8B5CF6', '#64748B',
]

// ─── Form schema ──────────────────────────────────────────────────────────────

function toKey(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '')
  return words.map((w) => w[0]).join('').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)
}

const schema = z.object({
  name:        z.string().min(2, 'Name must be at least 2 characters').max(50),
  boardKey:    z.string().min(1, 'Board key is required').max(5, 'Max 5 characters')
                  .regex(/^[A-Z0-9]+$/, 'Uppercase letters and numbers only'),
  description: z.string().max(200).optional(),
  background:  z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ─── Wizard ───────────────────────────────────────────────────────────────────

interface CreateBoardWizardProps {
  open: boolean
  onClose: () => void
}

export function CreateBoardWizard({ open, onClose }: CreateBoardWizardProps) {
  const queryClient = useQueryClient()
  const navigate    = useNavigate()

  const [step, setStep]     = useState<'template' | 'details'>('template')
  const [selected, setSelected] = useState<BoardType>('SCRUM')

  // Reset when modal closes
  useEffect(() => {
    if (!open) { setStep('template'); setSelected('SCRUM') }
  }, [open])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { background: BOARD_COLORS[0] },
  })

  const nameValue = watch('name', '')
  useEffect(() => {
    const key = toKey(nameValue)
    if (key) setValue('boardKey', key, { shouldValidate: false })
  }, [nameValue, setValue])

  const onSubmit = async (values: FormValues) => {
    try {
      const board = await boardsApi.create({
        name:        values.name,
        boardKey:    values.boardKey,
        boardType:   selected,
        description: values.description,
        background:  values.background,
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.boards.all('') })
      toast.success(`Board "${board.name}" created`)
      reset()
      onClose()
      navigate(`/boards/${board.id}`)
    } catch {
      toast.error('Failed to create board')
    }
  }

  const selectedTemplate = TEMPLATES.find((t) => t.type === selected)!

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-surface-border bg-surface shadow-2xl">

            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
              <div className="flex items-center gap-3">
                {step === 'details' && (
                  <button
                    onClick={() => setStep('template')}
                    className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <div>
                  <Dialog.Title className="text-sm font-semibold text-text-primary">
                    {step === 'template' ? 'Create a new lab' : `Configure — ${selectedTemplate.label}`}
                  </Dialog.Title>
                  <p className="text-xs text-text-muted">
                    Step {step === 'template' ? '1' : '2'} of 2
                  </p>
                </div>
              </div>

              {/* step dots */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className={cn('h-2 w-2 rounded-full transition-colors', step === 'details' ? 'bg-primary' : 'bg-surface-border')} />
                </div>
                <Dialog.Close asChild>
                  <button className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary">
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* ── Step 1: Template selection ── */}
            {step === 'template' && (
              <>
                <div className="px-6 pt-5 pb-2">
                  <p className="text-base font-semibold text-text-primary">Choose a template</p>
                  <p className="mt-0.5 text-sm text-text-muted">Pick the workflow that best fits your team. You can customise everything after.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 px-6 py-4">
                  {TEMPLATES.map(({ type, label, description, illustration }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelected(type)}
                      className={cn(
                        'group relative overflow-hidden rounded-xl border text-start transition-all',
                        selected === type
                          ? 'border-primary shadow-md shadow-primary/10 ring-2 ring-primary/20'
                          : 'border-surface-border hover:border-primary/40 hover:shadow-sm',
                      )}
                    >
                      {/* Selected checkmark */}
                      {selected === type && (
                        <div className="absolute end-2.5 top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-md">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}

                      {/* Illustration */}
                      <div className="overflow-hidden rounded-t-xl bg-surface-muted">
                        <img src={illustration} alt={label} className="w-full" />
                      </div>

                      {/* Label + description */}
                      <div className="px-4 py-3">
                        <p className={cn(
                          'text-sm font-semibold transition-colors',
                          selected === type ? 'text-primary' : 'text-text-primary',
                        )}>
                          {label}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-text-muted">{description}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-2 border-t border-surface-border px-6 py-4">
                  <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                  <Button type="button" onClick={() => setStep('details')}>
                    Continue with {selectedTemplate.label}
                  </Button>
                </div>
              </>
            )}

            {/* ── Step 2: Details form ── */}
            {step === 'details' && (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-5 px-6 py-5">

                  {/* Name + Key */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        label="Board name"
                        placeholder="e.g. Team Frontend"
                        autoFocus
                        error={errors.name?.message}
                        {...register('name')}
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        label="Key"
                        placeholder="TF"
                        error={errors.boardKey?.message}
                        {...register('boardKey')}
                        onChange={(e) =>
                          setValue('boardKey', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''), {
                            shouldValidate: true,
                          })
                        }
                      />
                    </div>
                  </div>

                  <Input
                    label="Description (optional)"
                    placeholder="What is this board for?"
                    {...register('description')}
                  />

                  <Controller
                    name="background"
                    control={control}
                    render={({ field }) => (
                      <ColorPicker
                        label="Color"
                        value={field.value ?? BOARD_COLORS[0]}
                        onChange={field.onChange}
                        colors={BOARD_COLORS}
                        showPreview
                      />
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-surface-border px-6 py-4">
                  <Button type="button" variant="secondary" onClick={() => setStep('template')}>
                    Back
                  </Button>
                  <Button type="submit" loading={isSubmitting}>
                    Create board
                  </Button>
                </div>
              </form>
            )}

          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
