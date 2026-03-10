import * as Dialog from '@radix-ui/react-dialog'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { boardsApi } from '@/api/boards'
import { queryKeys } from '@/api/queryKeys'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'

const PRESET_COLORS = [
  '#6B7280', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#F97316',
]

interface FormValues {
  name: string
  color: string
  wipLimit: string
}

interface AddColumnModalProps {
  open: boolean
  onClose: () => void
  boardId: string
}

export function AddColumnModal({ open, onClose, boardId }: AddColumnModalProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { name: '', color: PRESET_COLORS[0], wipLimit: '' },
  })

  const selectedColor = watch('color')

  const onSubmit = async (values: FormValues) => {
    try {
      await boardsApi.createColumn(boardId, {
        name: values.name.trim(),
        color: values.color,
        wipLimit: values.wipLimit ? Number(values.wipLimit) : undefined,
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })
      toast.success(`Column "${values.name}" added`)
      reset()
      onClose()
    } catch {
      toast.error('Failed to add column')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-surface-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
              <Dialog.Title className="text-sm font-semibold text-text-primary">
                Add column
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="rounded-md p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-4 px-5 py-4">
                <Input
                  label="Column name"
                  placeholder="e.g. Testing"
                  autoFocus
                  error={errors.name?.message}
                  {...register('name', { required: 'Name is required' })}
                />

                {/* Color picker */}
                <div>
                  <p className="mb-2 text-sm font-medium text-text-primary">Color</p>
                  <div className="flex items-center gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setValue('color', color)}
                        className={cn(
                          'h-6 w-6 rounded-full transition-transform hover:scale-110',
                          selectedColor === color && 'ring-2 ring-offset-2 ring-primary dark:ring-offset-surface',
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <Input
                  label="WIP limit (optional)"
                  placeholder="e.g. 5"
                  type="number"
                  min={1}
                  {...register('wipLimit')}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-surface-border px-5 py-4">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Add column
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
