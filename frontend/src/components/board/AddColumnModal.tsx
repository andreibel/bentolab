import {useForm} from 'react-hook-form'
import {useQueryClient} from '@tanstack/react-query'
import {toast} from 'sonner'
import {boardsApi} from '@/api/boards'
import {queryKeys} from '@/api/queryKeys'
import {Button} from '@/components/ui/Button'
import {Input} from '@/components/ui/Input'
import {Modal} from '@/components/ui/Modal'
import {ColorPicker} from '@/components/common/ColorPicker'

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
    defaultValues: { name: '', color: '#6B7280', wipLimit: '' },
  })

  const selectedColor = watch('color')

  const onSubmit = async (values: FormValues) => {
    try {
      await boardsApi.createColumn(boardId, {
        name:     values.name.trim(),
        color:    values.color,
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
    <Modal open={open} onClose={onClose} title="Add column">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          <Input
            label="Column name"
            placeholder="e.g. Testing"
            autoFocus
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />

          <ColorPicker
            label="Color"
            value={selectedColor}
            onChange={(color) => setValue('color', color)}
          />

          <Input
            label="WIP limit (optional)"
            placeholder="e.g. 5"
            type="number"
            min={1}
            {...register('wipLimit')}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Add column
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}
