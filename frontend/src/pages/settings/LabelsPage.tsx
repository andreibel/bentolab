import {useState} from 'react'
import {Loader2, Pencil, Plus, Tag, Trash2, X} from 'lucide-react'
import {toast} from 'sonner'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {labelsApi, type Label} from '@/api/labels'
import {queryKeys} from '@/api/queryKeys'
import {ColorPicker} from '@/components/common/ColorPicker'
import {useAuthStore} from '@/stores/authStore'
import {cn} from '@/utils/cn'

const LABEL_COLORS = [
  '#6B7280', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#F97316',
  '#14B8A6', '#06B6D4', '#84CC16', '#A855F7',
]

// ── Inline form (create or edit) ─────────────────────────────────────────────

interface LabelFormProps {
  initial?: Label
  onSave: (data: { name: string; color: string; description: string }) => void
  onCancel: () => void
  saving: boolean
}

function LabelForm({ initial, onSave, onCancel, saving }: LabelFormProps) {
  const [name,        setName]        = useState(initial?.name ?? '')
  const [color,       setColor]       = useState(initial?.color ?? LABEL_COLORS[1])
  const [description, setDescription] = useState(initial?.description ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), color, description: description.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-primary/30 bg-primary-subtle/30 p-4">
      <div className="mb-3 flex items-center gap-3">
        {/* Color swatch */}
        <div className="h-5 w-5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        {/* Name input */}
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Label name"
          maxLength={100}
          className="flex-1 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </div>

      <div className="mb-3">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          maxLength={200}
          className="w-full rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </div>

      <div className="mb-4">
        <ColorPicker value={color} onChange={setColor} colors={LABEL_COLORS} />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-surface-border px-3 text-sm text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || saving}
          className={cn(
            'flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors',
            'bg-primary text-white hover:bg-primary-light',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {initial ? 'Save' : 'Create'}
        </button>
      </div>
    </form>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────────

interface LabelRowProps {
  label: Label
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
}

function LabelRow({ label, onEdit, onDelete, deleting }: LabelRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-muted">
      <div className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />
      <span
        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
        style={{ backgroundColor: label.color + '22', color: label.color }}
      >
        {label.name}
      </span>
      {label.description && (
        <span className="text-sm text-text-muted">{label.description}</span>
      )}
      <div className="ms-auto flex items-center gap-1">
        <button
          onClick={onEdit}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-border hover:text-text-primary"
          title="Edit label"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
          title="Delete label"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LabelsPage() {
  const { currentOrgId } = useAuthStore()
  const queryClient = useQueryClient()

  const [creating,   setCreating]   = useState(false)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: labels = [], isLoading } = useQuery({
    queryKey: queryKeys.labels.list(currentOrgId!),
    queryFn:  labelsApi.list,
    enabled:  !!currentOrgId,
  })

  const createMutation = useMutation({
    mutationFn: labelsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.labels.list(currentOrgId!) })
      setCreating(false)
      toast.success('Label created')
    },
    onError: () => toast.error('Failed to create label'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; color?: string; description?: string }) =>
      labelsApi.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.labels.list(currentOrgId!) })
      setEditingId(null)
      toast.success('Label updated')
    },
    onError: () => toast.error('Failed to update label'),
  })

  const deleteMutation = useMutation({
    mutationFn: labelsApi.delete,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.labels.list(currentOrgId!) })
      setDeletingId(null)
      toast.success('Label deleted')
    },
    onError: () => { setDeletingId(null); toast.error('Failed to delete label') },
  })

  function handleDelete(label: Label) {
    setDeletingId(label.id)
    deleteMutation.mutate(label.id)
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle">
          <Tag className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Labels</h1>
          <p className="text-sm text-text-muted">
            Manage labels used to categorize issues across all boards in this organization.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-surface-border bg-surface">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <span className="text-sm text-text-muted">
            {isLoading ? '…' : `${labels.length} label${labels.length !== 1 ? 's' : ''}`}
          </span>
          {!creating && (
            <button
              onClick={() => { setCreating(true); setEditingId(null) }}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary-light"
            >
              <Plus className="h-3.5 w-3.5" />
              New label
            </button>
          )}
        </div>

        <div className="p-4 space-y-1">
          {/* Create form */}
          {creating && (
            <div className="mb-3">
              <LabelForm
                onSave={(data) => createMutation.mutate(data)}
                onCancel={() => setCreating(false)}
                saving={createMutation.isPending}
              />
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && labels.length === 0 && !creating && (
            <div className="py-10 text-center">
              <Tag className="mx-auto mb-3 h-8 w-8 text-text-muted opacity-40" />
              <p className="text-sm text-text-muted">No labels yet. Create one to get started.</p>
            </div>
          )}

          {/* Label list */}
          {labels.map((label) =>
            editingId === label.id ? (
              <div key={label.id} className="mb-1">
                <LabelForm
                  initial={label}
                  onSave={(data) => updateMutation.mutate({ id: label.id, ...data })}
                  onCancel={() => setEditingId(null)}
                  saving={updateMutation.isPending}
                />
              </div>
            ) : (
              <LabelRow
                key={label.id}
                label={label}
                onEdit={() => { setEditingId(label.id); setCreating(false) }}
                onDelete={() => handleDelete(label)}
                deleting={deletingId === label.id}
              />
            )
          )}
        </div>
      </section>
    </div>
  )
}
