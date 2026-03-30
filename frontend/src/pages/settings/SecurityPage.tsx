import {useState} from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {AlertCircle, Check, ChevronDown, Lock, ShieldCheck} from 'lucide-react'
import {toast} from 'sonner'
import {useAuthStore} from '@/stores/authStore'
import {permissionsApi} from '@/api/permissions'
import {boardsApi} from '@/api/boards'
import type {Board} from '@/types/board'
import {queryKeys} from '@/api/queryKeys'
import {cn} from '@/utils/cn'
import {
  BOARD_ROLE_LABELS,
  BOARD_ROLES,
  type BoardPermission,
  type BoardRole,
  ORG_ROLE_LABELS,
  ORG_ROLES,
  type OrgPermission,
  type OrgRole,
} from '@/types/permissions'

// ─── Tab type ────────────────────────────────────────────────────────────────

type Tab = 'org' | 'board'

// ─── Permission row ──────────────────────────────────────────────────────────

function OrgPermissionRow({
  permission,
  canEdit,
  onToggle,
  pending,
}: {
  permission: OrgPermission
  canEdit: boolean
  onToggle: (role: OrgRole, current: boolean) => void
  pending: boolean
}) {
  return (
    <tr className="group border-b border-surface-border last:border-0">
      <td className="py-3 pe-4 ps-4">
        <div className="flex items-start gap-2">
          {permission.locked && (
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
          )}
          <div>
            <p className="text-sm font-medium text-text-primary">{permission.label}</p>
            <p className="mt-0.5 text-xs text-text-muted">{permission.description}</p>
          </div>
        </div>
      </td>
      {ORG_ROLES.map((role) => {
        const checked = permission.allowedRoles.includes(role)
        const isLocked = permission.locked
        const isOwnerCol = role === 'ORG_OWNER'

        return (
          <td key={role} className="py-3 text-center">
            <button
              disabled={isLocked || isOwnerCol || !canEdit || pending}
              onClick={() => !isLocked && !isOwnerCol && onToggle(role, checked)}
              className={cn(
                'inline-flex h-5 w-5 items-center justify-center rounded transition-all',
                checked
                  ? 'bg-primary text-white'
                  : 'border border-surface-border bg-surface hover:border-primary',
                (isLocked || isOwnerCol) && 'cursor-not-allowed opacity-60',
                !isLocked && !isOwnerCol && canEdit && !pending && 'cursor-pointer'
              )}
              title={isLocked ? 'This permission is locked' : isOwnerCol ? 'Owner always has this permission' : undefined}
            >
              {checked && <Check className="h-3 w-3" strokeWidth={3} />}
            </button>
          </td>
        )
      })}
    </tr>
  )
}

function BoardPermissionRow({
  permission,
  canEdit,
  onToggle,
  pending,
}: {
  permission: BoardPermission
  canEdit: boolean
  onToggle: (role: BoardRole, current: boolean) => void
  pending: boolean
}) {
  return (
    <tr className="group border-b border-surface-border last:border-0">
      <td className="py-3 pe-4 ps-4">
        <div className="flex items-start gap-2">
          {permission.locked && (
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
          )}
          <div>
            <p className="text-sm font-medium text-text-primary">{permission.label}</p>
            <p className="mt-0.5 text-xs text-text-muted">{permission.description}</p>
          </div>
        </div>
      </td>
      {BOARD_ROLES.map((role) => {
        const checked = permission.allowedRoles.includes(role)
        const isLocked = permission.locked
        const isOwnerCol = role === 'PRODUCT_OWNER'

        return (
          <td key={role} className="py-3 text-center">
            <button
              disabled={isLocked || isOwnerCol || !canEdit || pending}
              onClick={() => !isLocked && !isOwnerCol && onToggle(role, checked)}
              className={cn(
                'inline-flex h-5 w-5 items-center justify-center rounded transition-all',
                checked
                  ? 'bg-primary text-white'
                  : 'border border-surface-border bg-surface hover:border-primary',
                (isLocked || isOwnerCol) && 'cursor-not-allowed opacity-60',
                !isLocked && !isOwnerCol && canEdit && !pending && 'cursor-pointer'
              )}
              title={isLocked ? 'This permission is locked' : isOwnerCol ? 'Product Owner always has this permission' : undefined}
            >
              {checked && <Check className="h-3 w-3" strokeWidth={3} />}
            </button>
          </td>
        )
      })}
    </tr>
  )
}

// ─── Org permissions section ─────────────────────────────────────────────────

function OrgPermissionsSection({ orgId, isOwner }: { orgId: string; isOwner: boolean }) {
  const queryClient = useQueryClient()

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: queryKeys.permissions.org(orgId),
    queryFn: () => permissionsApi.getOrgPermissions(orgId),
  })

  const mutation = useMutation({
    mutationFn: ({ key, roles }: { key: string; roles: string[] }) =>
      permissionsApi.updateOrgPermission(orgId, key, roles),
    onSuccess: (updated) => {
      queryClient.setQueryData<OrgPermission[]>(
        queryKeys.permissions.org(orgId),
        (prev) => prev?.map((p) => (p.permissionKey === updated.permissionKey ? updated : p)) ?? prev
      )
    },
    onError: () => toast.error('Failed to update permission'),
  })

  const handleToggle = (permission: OrgPermission, role: OrgRole, checked: boolean) => {
    const next = checked
      ? permission.allowedRoles.filter((r) => r !== role)
      : [...permission.allowedRoles, role]
    mutation.mutate({ key: permission.permissionKey, roles: next })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      {!isOwner && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-900/20">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Only the organization owner can change permission settings.
          </p>
        </div>
      )}
      <div className="overflow-hidden rounded-lg border border-surface-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-border bg-surface-muted">
              <th className="py-2.5 pe-4 ps-4 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">
                Permission
              </th>
              {ORG_ROLES.map((role) => (
                <th
                  key={role}
                  className="min-w-[90px] py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-text-muted"
                >
                  {ORG_ROLE_LABELS[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-surface">
            {permissions.map((p) => (
              <OrgPermissionRow
                key={p.permissionKey}
                permission={p}
                canEdit={isOwner}
                onToggle={(role, checked) => handleToggle(p, role, checked)}
                pending={mutation.isPending}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Board permissions section ────────────────────────────────────────────────

function BoardPermissionsSection({ orgId, orgRole }: { orgId: string; orgRole: string | null }) {
  const queryClient = useQueryClient()
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const canEdit = orgRole === 'ORG_OWNER' || orgRole === 'ORG_ADMIN'

  const { data: boards = [] } = useQuery<Board[]>({
    queryKey: queryKeys.boards.all(orgId),
    queryFn: () => boardsApi.list(),
    enabled: !!orgId,
  })

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: queryKeys.permissions.board(selectedBoardId!),
    queryFn: () => permissionsApi.getBoardPermissions(selectedBoardId!),
    enabled: !!selectedBoardId,
  })

  const mutation = useMutation({
    mutationFn: ({ key, roles }: { key: string; roles: string[] }) =>
      permissionsApi.updateBoardPermission(selectedBoardId!, key, roles),
    onSuccess: (updated) => {
      queryClient.setQueryData<BoardPermission[]>(
        queryKeys.permissions.board(selectedBoardId!),
        (prev) => prev?.map((p) => (p.permissionKey === updated.permissionKey ? updated : p)) ?? prev
      )
    },
    onError: () => toast.error('Failed to update permission'),
  })

  const handleToggle = (permission: BoardPermission, role: BoardRole, checked: boolean) => {
    const next = checked
      ? permission.allowedRoles.filter((r) => r !== role)
      : [...permission.allowedRoles, role]
    mutation.mutate({ key: permission.permissionKey, roles: next })
  }

  const selectedBoard = boards.find((b) => b.id === selectedBoardId)

  return (
    <div>
      {/* Board selector */}
      <div className="mb-4 relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full max-w-sm items-center justify-between gap-2 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-text-primary transition-colors hover:border-primary"
        >
          <span className={selectedBoard ? 'text-text-primary' : 'text-text-muted'}>
            {selectedBoard ? selectedBoard.name : 'Select a board…'}
          </span>
          <ChevronDown className={cn('h-4 w-4 text-text-muted transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute z-20 mt-1 w-full max-w-sm rounded-lg border border-surface-border bg-surface shadow-lg">
            {boards.length === 0 ? (
              <div className="px-3 py-2.5 text-sm text-text-muted">No boards yet</div>
            ) : (
              boards.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { setSelectedBoardId(b.id); setOpen(false) }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-surface-muted',
                    b.id === selectedBoardId ? 'text-primary' : 'text-text-primary'
                  )}
                >
                  {b.id === selectedBoardId && <Check className="h-3.5 w-3.5 text-primary" />}
                  <span className={b.id === selectedBoardId ? 'ms-0' : 'ms-5'}>{b.name}</span>
                  <span className="ms-auto text-xs text-text-muted">{b.boardKey}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {!selectedBoardId ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-surface-border py-12 text-center">
          <ShieldCheck className="mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm font-medium text-text-secondary">Select a board to view its permissions</p>
          <p className="mt-1 text-xs text-text-muted">Each board has its own permission matrix</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div>
          {!canEdit && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-900/20">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Only the board Product Owner or org admin can change board permissions.
              </p>
            </div>
          )}
          <div className="overflow-hidden rounded-lg border border-surface-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface-muted">
                  <th className="py-2.5 pe-4 ps-4 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Permission
                  </th>
                  {BOARD_ROLES.map((role) => (
                    <th
                      key={role}
                      className="min-w-[100px] py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-text-muted"
                    >
                      {BOARD_ROLE_LABELS[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-surface">
                {permissions.map((p) => (
                  <BoardPermissionRow
                    key={p.permissionKey}
                    permission={p}
                    canEdit={canEdit}
                    onToggle={(role, checked) => handleToggle(p, role, checked)}
                    pending={mutation.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const [tab, setTab] = useState<Tab>('org')
  const { currentOrgId, orgRole } = useAuthStore()
  const isOwner = orgRole === 'ORG_OWNER'

  if (!currentOrgId) return null

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Security & Permissions</h1>
          <p className="text-sm text-text-muted">
            Control what each role can see and do across your organization and boards.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-surface-border bg-surface-muted p-1 w-fit">
        {(['org', 'board'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              tab === t
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {t === 'org' ? 'Organization' : 'Board'}
          </button>
        ))}
      </div>

      {/* Role legend */}
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-muted">
        <span className="font-medium text-text-secondary">Roles:</span>
        {(tab === 'org' ? ORG_ROLES : BOARD_ROLES).map((role) => (
          <span key={role} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            {tab === 'org' ? ORG_ROLE_LABELS[role as keyof typeof ORG_ROLE_LABELS] : BOARD_ROLE_LABELS[role as keyof typeof BOARD_ROLE_LABELS]}
            <span className="text-text-muted/60">({role})</span>
          </span>
        ))}
        <span className="ms-auto flex items-center gap-1.5">
          <Lock className="h-3 w-3" />
          Locked — cannot be changed
        </span>
      </div>

      {tab === 'org' ? (
        <OrgPermissionsSection orgId={currentOrgId} isOwner={isOwner} />
      ) : (
        <BoardPermissionsSection orgId={currentOrgId} orgRole={orgRole} />
      )}
    </div>
  )
}
