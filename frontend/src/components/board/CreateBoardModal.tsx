import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { boardsApi } from '@/api/boards'
import { queryKeys } from '@/api/queryKeys'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'
import type { Board } from '@/types/board'

const BOARD_TYPES: { value: Board['boardType']; label: string; description: string }[] = [
  { value: 'SCRUM',        label: 'Scrum',        description: 'Sprints, backlog, velocity' },
  { value: 'KANBAN',       label: 'Kanban',       description: 'Continuous flow, WIP limits' },
  { value: 'BUG_TRACKING', label: 'Bug Tracking', description: 'Triage, reproduce, resolve' },
  { value: 'CUSTOM',       label: 'Custom',       description: 'Start with a blank board'   },
]

const PRESET_COLORS = [
  '#5B47E0', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#8B5CF6', '#64748B',
]

function toKey(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 1) {
    return words[0].slice(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '')
  }
  return words
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5)
}

const schema = z.object({
  name:        z.string().min(2, 'Name must be at least 2 characters').max(50),
  boardKey:    z.string().min(1, 'Board key is required').max(5, 'Max 5 characters')
                  .regex(/^[A-Z0-9]+$/, 'Uppercase letters and numbers only'),
  boardType:   z.enum(['SCRUM', 'KANBAN', 'BUG_TRACKING', 'CUSTOM']),
  description: z.string().max(200).optional(),
  background:  z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface CreateBoardModalProps {
  open: boolean
  onClose: () => void
}

export function CreateBoardModal({ open, onClose }: CreateBoardModalProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

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
    defaultValues: { boardType: 'SCRUM', background: PRESET_COLORS[0] },
  })

  const nameValue = watch('name', '')
  const selectedColor = watch('background')

  // Auto-generate board key from name
  useEffect(() => {
    const key = toKey(nameValue)
    if (key) setValue('boardKey', key, { shouldValidate: false })
  }, [nameValue, setValue])

  const onSubmit = async (values: FormValues) => {
    try {
      const board = await boardsApi.create({
        name:        values.name,
        boardKey:    values.boardKey,
        boardType:   values.boardType,
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

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-surface-border bg-surface shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
              <Dialog.Title className="text-base font-semibold text-text-primary">
                Create board
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="rounded-md p-1.5 text-text-muted hover:bg-surface-muted hover:text-text-primary">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-5 px-6 py-5">
                {/* Name + Key */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      label="Board name"
                      placeholder="Team Frontend"
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

                {/* Board type */}
                <div>
                  <p className="mb-2 text-sm font-medium text-text-primary">Board type</p>
                  <Controller
                    name="boardType"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-2">
                        {BOARD_TYPES.map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => field.onChange(t.value)}
                            className={cn(
                              'rounded-lg border px-3 py-2.5 text-start transition-colors',
                              field.value === t.value
                                ? 'border-primary bg-primary-subtle'
                                : 'border-surface-border hover:border-primary/40 hover:bg-surface-muted'
                            )}
                          >
                            <p className={cn('text-sm font-medium', field.value === t.value ? 'text-primary' : 'text-text-primary')}>
                              {t.label}
                            </p>
                            <p className="mt-0.5 text-xs text-text-muted">{t.description}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>

                {/* Description */}
                <Input
                  label="Description"
                  placeholder="What is this board for? (optional)"
                  {...register('description')}
                />

                {/* Color */}
                <div>
                  <p className="mb-2 text-sm font-medium text-text-primary">Color</p>
                  <Controller
                    name="background"
                    control={control}
                    render={({ field }) => (
                      <div className="flex gap-2">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => field.onChange(color)}
                            className={cn(
                              'h-7 w-7 rounded-full transition-transform hover:scale-110',
                              field.value === color && 'ring-2 ring-offset-2 ring-primary dark:ring-offset-surface'
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        {/* Preview strip */}
                        <div
                          className="ms-2 flex-1 rounded-lg"
                          style={{ backgroundColor: selectedColor ?? PRESET_COLORS[0] }}
                        />
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 border-t border-surface-border px-6 py-4">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Create board
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
