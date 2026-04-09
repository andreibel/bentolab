import {useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {useTranslation} from 'react-i18next'
import {toast} from 'sonner'
import {AlertTriangle, Archive, Lock, Trash2, X} from 'lucide-react'
import {boardsApi} from '@/api/boards'
import {queryKeys} from '@/api/queryKeys'
import {useAuthStore} from '@/stores/authStore'
import {DeleteBoardModal} from './DeleteBoardModal'
import type {Board} from '@/types/board'

const BOARD_COLORS = [
  '#5B47E0', '#7C3AED', '#DB2777', '#DC2626',
  '#EA580C', '#CA8A04', '#16A34A', '#0891B2',
  '#1D4ED8', '#374151',
]

interface Props {
  board: Board & { columns?: unknown[] }
  onClose: () => void
}

export function BoardSettingsPanel({ board, onClose }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { user, orgRole } = useAuthStore()

  const [name,        setName]        = useState(board.name)
  const [description, setDescription] = useState(board.description ?? '')
  const [background,  setBackground]  = useState(board.background ?? BOARD_COLORS[0])
  const [saving,      setSaving]      = useState(false)
  const [archiving,   setArchiving]   = useState(false)
  const [deleteOpen,  setDeleteOpen]  = useState(false)

  // Determine current user's board role
  const { data: members } = useQuery({
    queryKey: queryKeys.boards.members(board.id),
    queryFn:  () => boardsApi.listMembers(board.id),
  })

  const myBoardRole = members?.find((m) => m.userId === user?.id)?.boardRole
  const isOrgAdmin  = orgRole === 'ORG_OWNER' || orgRole === 'ORG_ADMIN'
  const isOrgOwner  = orgRole === 'ORG_OWNER'
  const isPO        = myBoardRole === 'PRODUCT_OWNER'

  // Archive: PRODUCT_OWNER or ORG_ADMIN+
  const canArchive = isPO || isOrgAdmin
  // Delete: PRODUCT_OWNER or ORG_OWNER only (matches requireBoardOwnerOrOrgOwner)
  const canDelete  = isPO || isOrgOwner

  const isDirty =
    name.trim() !== board.name ||
    description.trim() !== (board.description ?? '') ||
    background !== (board.background ?? BOARD_COLORS[0])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await boardsApi.update(board.id, {
        name:        name.trim(),
        description: description.trim() || undefined,
        background,
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(board.id) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.boards.all('') })
      toast.success(t('boardSettings.boardUpdated'))
      onClose()
    } catch {
      toast.error(t('boardSettings.failedToUpdate'))
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    setArchiving(true)
    try {
      await boardsApi.archive(board.id)
      await queryClient.invalidateQueries({ queryKey: queryKeys.boards.all('') })
      await queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(board.id) })
      toast.success(board.isArchived ? t('boardSettings.boardUnarchived') : t('boardSettings.boardArchived'))
      onClose()
    } catch {
      toast.error(t('boardSettings.failedToArchive'))
    } finally {
      setArchiving(false)
    }
  }

  return (
    <>
      <div className="flex h-full w-80 shrink-0 flex-col border-s border-surface-border bg-surface">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-surface-border px-5 py-4">
          <h2 className="text-sm font-semibold text-text-primary">{t('boardSettings.title')}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
          {/* Board key (read-only) */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-muted">
              <Lock className="h-3 w-3" />
              {t('boardSettings.boardKey')}
            </label>
            <div className="flex h-9 items-center rounded-lg border border-surface-border bg-surface-muted px-3 font-mono text-sm text-text-muted">
              {board.boardKey}
            </div>
            <p className="mt-1 text-[11px] text-text-muted">{t('boardSettings.boardKeyNote')}</p>
          </div>

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">{t('boardSettings.name')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('boardSettings.namePlaceholder')}
              className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">{t('boardSettings.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t('boardSettings.descPlaceholder')}
              className="w-full resize-none rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Background color */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-muted">{t('boardSettings.color')}</label>
            <div className="flex flex-wrap gap-2">
              {BOARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBackground(c)}
                  className="h-7 w-7 rounded-lg transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    boxShadow:
                      background === c
                        ? `0 0 0 2px var(--color-surface), 0 0 0 4px ${c}`
                        : 'none',
                  }}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div
                className="h-7 w-7 shrink-0 rounded-lg border border-surface-border"
                style={{ backgroundColor: background }}
              />
              <input
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="#5B47E0"
                className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-1.5 font-mono text-xs text-text-primary outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Danger zone */}
          {(canArchive || canDelete) && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-semibold text-red-500">{t('boardSettings.dangerZone')}</span>
              </div>

              <div className="flex flex-col gap-2">
                {canArchive && (
                  <button
                    onClick={handleArchive}
                    disabled={archiving}
                    className="flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    {archiving
                      ? t('boardSettings.processing')
                      : board.isArchived
                        ? t('boardSettings.unarchiveBoard')
                        : t('boardSettings.archiveBoard')}
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={() => setDeleteOpen(true)}
                    className="flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('boardSettings.deleteBoard')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-surface-border p-4">
          <button
            onClick={handleSave}
            disabled={!isDirty || !name.trim() || saving}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-40"
          >
            {saving ? t('actions.saving') : t('boardSettings.saveChanges')}
          </button>
        </div>
      </div>

      {deleteOpen && (
        <DeleteBoardModal board={board} onClose={() => setDeleteOpen(false)} />
      )}
    </>
  )
}
