import {useState} from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {toast} from 'sonner'
import {Check, ChevronDown, CheckCircle2, Link2, Loader2, Mail, Shield, Trash2, UserPlus, Users} from 'lucide-react'
import {orgsApi} from '@/api/orgs'
import {usersApi} from '@/api/users'
import {useAuthStore} from '@/stores/authStore'
import {Button} from '@/components/ui/Button'
import {OrgInviteModal} from '@/components/org/OrgInviteModal'
import {queryKeys} from '@/api/queryKeys'
import {cn} from '@/utils/cn'
import type {OrgInvitation, OrgMember} from '@/types/org'
import type {UserProfile} from '@/types/board'

// ─── Constants ────────────────────────────────────────────────────────────────

type Tab = 'members' | 'invitations'

const ROLE_LABELS: Record<string, string> = {
  ORG_MEMBER: 'Member',
  ORG_ADMIN:  'Admin',
  ORG_OWNER:  'Owner',
}

const ASSIGNABLE_ROLES = ['ORG_MEMBER', 'ORG_ADMIN'] as const

function buildInviteUrl(token: string) {
  return `${window.location.origin}/invite?token=${token}`
}

// ─── Role dropdown ────────────────────────────────────────────────────────────

function RoleDropdown({
  currentRole,
  isOwner,
  canEdit,
  pending,
  onChange,
}: {
  currentRole: string
  isOwner: boolean
  canEdit: boolean
  pending: boolean
  onChange: (role: string) => void
}) {
  const [open, setOpen] = useState(false)

  if (isOwner || !canEdit) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border px-2.5 py-0.5 text-xs font-medium text-text-secondary">
        {isOwner && <Shield className="h-3 w-3 text-primary" />}
        {ROLE_LABELS[currentRole] ?? currentRole}
      </span>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-primary/40 hover:text-text-primary disabled:opacity-50"
      >
        {ROLE_LABELS[currentRole] ?? currentRole}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute end-0 z-20 mt-1 min-w-[110px] overflow-hidden rounded-lg border border-surface-border bg-surface shadow-lg">
          {ASSIGNABLE_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => { onChange(role); setOpen(false) }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-surface-muted',
                currentRole === role ? 'text-primary font-semibold' : 'text-text-primary',
              )}
            >
              {currentRole === role && <Check className="h-3 w-3 shrink-0" />}
              <span className={currentRole === role ? '' : 'ms-5'}>{ROLE_LABELS[role]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Member row ───────────────────────────────────────────────────────────────

function MemberRow({
  member,
  profile,
  isSelf,
  canEdit,
  onRoleChange,
  onRemove,
  rolePending,
  removePending,
}: {
  member: OrgMember
  profile: UserProfile | undefined
  isSelf: boolean
  canEdit: boolean
  onRoleChange: (role: string) => void
  onRemove: () => void
  rolePending: boolean
  removePending: boolean
}) {
  const initials = profile
    ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?'
  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : member.userId

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Avatar */}
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary-subtle ring-1 ring-surface-border">
        {profile?.avatarUrl ? (
          <img src={profile.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-primary">
            {initials}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-text-primary">{displayName}</p>
          {isSelf && (
            <span className="rounded-full bg-primary-subtle px-1.5 py-0.5 text-[10px] font-semibold text-primary">You</span>
          )}
        </div>
        <p className="truncate text-xs text-text-muted">{profile?.email ?? ''}</p>
      </div>

      {/* Role */}
      {rolePending ? (
        <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
      ) : (
        <RoleDropdown
          currentRole={member.orgRole}
          isOwner={member.orgRole === 'ORG_OWNER'}
          canEdit={canEdit && !isSelf}
          pending={rolePending}
          onChange={onRoleChange}
        />
      )}

      {/* Remove */}
      {canEdit && !isSelf && member.orgRole !== 'ORG_OWNER' && (
        <button
          onClick={onRemove}
          disabled={removePending}
          title="Remove member"
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 disabled:opacity-40"
        >
          {removePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      )}
    </div>
  )
}

// ─── Invitation row ───────────────────────────────────────────────────────────

function InvitationRow({
  invitation, copied, onCopyLink, onRevoke, revoking,
}: {
  invitation: OrgInvitation
  copied: boolean
  onCopyLink: () => void
  onRevoke: () => void
  revoking: boolean
}) {
  const isOpenLink = invitation.email === null
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-raised">
        {isOpenLink ? <Link2 className="h-4 w-4 text-text-muted" /> : <Mail className="h-4 w-4 text-text-muted" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {isOpenLink ? 'Open invite link' : invitation.email}
        </p>
        <p className="text-xs text-text-muted">
          {ROLE_LABELS[invitation.orgRole] ?? invitation.orgRole}
          {' · '}
          expires {new Date(invitation.expiresAt).toLocaleDateString()}
        </p>
      </div>
      <span className="hidden rounded-full border border-surface-border px-2 py-0.5 text-xs text-text-muted sm:inline-flex">
        {isOpenLink ? 'Link' : 'Email'}
      </span>
      <div className="flex items-center gap-1">
        {isOpenLink && (
          <button
            onClick={onCopyLink}
            title="Copy invite link"
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-raised hover:text-primary"
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
          </button>
        )}
        <button
          onClick={onRevoke}
          disabled={revoking}
          title="Revoke invitation"
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MembersPage() {
  const { currentOrgId, orgName, orgRole, user } = useAuthStore()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('members')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const canEdit = orgRole === 'ORG_OWNER' || orgRole === 'ORG_ADMIN'
  const INVITES_KEY = ['invitations', currentOrgId, 'PENDING']

  // ── Members query ─────────────────────────────────────────────────────────
  const { data: members = [], isLoading: membersLoading } = useQuery<OrgMember[]>({
    queryKey: queryKeys.orgs.members(currentOrgId!),
    queryFn: () => orgsApi.listMembers(currentOrgId!),
    enabled: !!currentOrgId,
  })

  // Batch-fetch user profiles once we have member IDs
  const memberIds = members.map((m) => m.userId)
  const { data: profiles = [] } = useQuery<UserProfile[]>({
    queryKey: ['users', 'batch', ...memberIds],
    queryFn: () => usersApi.batchGet(memberIds),
    enabled: memberIds.length > 0,
  })
  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]))

  // ── Invitations query ─────────────────────────────────────────────────────
  const { data: pendingInvites = [], isLoading: invitesLoading } = useQuery<OrgInvitation[]>({
    queryKey: INVITES_KEY,
    queryFn: () => orgsApi.listInvitations(currentOrgId!, 'PENDING'),
    enabled: !!currentOrgId,
  })

  // ── Mutations ─────────────────────────────────────────────────────────────
  const [pendingRoleUserId, setPendingRoleUserId] = useState<string | null>(null)
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      orgsApi.updateMemberRole(currentOrgId!, userId, role),
    onMutate: ({ userId }) => setPendingRoleUserId(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgs.members(currentOrgId!) })
      toast.success('Role updated')
    },
    onError: () => toast.error('Failed to update role'),
    onSettled: () => setPendingRoleUserId(null),
  })

  const [pendingRemoveUserId, setPendingRemoveUserId] = useState<string | null>(null)
  const removeMutation = useMutation({
    mutationFn: (userId: string) => orgsApi.removeMember(currentOrgId!, userId),
    onMutate: (userId) => setPendingRemoveUserId(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgs.members(currentOrgId!) })
      toast.success('Member removed')
    },
    onError: () => toast.error('Failed to remove member'),
    onSettled: () => setPendingRemoveUserId(null),
  })

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => orgsApi.revokeInvitation(currentOrgId!, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITES_KEY })
      toast.success('Invitation revoked')
    },
    onError: () => toast.error('Could not revoke invitation'),
  })

  const handleCopyLink = async (token: string) => {
    await navigator.clipboard.writeText(buildInviteUrl(token))
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  if (!currentOrgId) return null

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Members</h1>
            <p className="text-sm text-text-muted">
              Manage who has access to <span className="font-medium text-text-primary">{orgName ?? 'your workspace'}</span>.
            </p>
          </div>
        </div>
        {canEdit && (
          <Button size="sm" className="gap-2" onClick={() => setShowInviteModal(true)}>
            <UserPlus className="h-4 w-4" />
            Invite people
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg border border-surface-border bg-surface-muted p-1 w-fit">
        {(['members', 'invitations'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              tab === t
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {t === 'members' ? 'Members' : 'Invitations'}
            {t === 'invitations' && pendingInvites.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {pendingInvites.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Members tab ──────────────────────────────────────────────────── */}
      {tab === 'members' && (
        <div className="rounded-xl border border-surface-border bg-surface">
          {membersLoading ? (
            <div className="flex items-center justify-center py-10 text-sm text-text-muted">
              <Loader2 className="me-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : members.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-muted">No members found.</div>
          ) : (
            <div className="flex flex-col divide-y divide-surface-border">
              {members.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  profile={profileMap[member.userId]}
                  isSelf={member.userId === user?.id}
                  canEdit={canEdit}
                  rolePending={pendingRoleUserId === member.userId}
                  removePending={pendingRemoveUserId === member.userId}
                  onRoleChange={(role) => roleMutation.mutate({ userId: member.userId, role })}
                  onRemove={() => removeMutation.mutate(member.userId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Invitations tab ───────────────────────────────────────────────── */}
      {tab === 'invitations' && (
        <>
          {invitesLoading ? (
            <div className="rounded-xl border border-surface-border p-8 text-center text-sm text-text-muted">
              Loading…
            </div>
          ) : pendingInvites.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-border p-8 text-center">
              <UserPlus className="mx-auto mb-3 h-8 w-8 text-text-muted" />
              <p className="text-sm font-medium text-text-primary">No pending invitations</p>
              <p className="mt-1 text-xs text-text-muted">Invite teammates via email or a shareable link.</p>
              {canEdit && (
                <Button size="sm" className="mt-4 gap-2" onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="h-4 w-4" />
                  Invite people
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-surface-border rounded-xl border border-surface-border">
              {pendingInvites.map((inv) => (
                <InvitationRow
                  key={inv.id}
                  invitation={inv}
                  copied={copiedToken === inv.token}
                  onCopyLink={() => handleCopyLink(inv.token)}
                  onRevoke={() => revokeMutation.mutate(inv.id)}
                  revoking={revokeMutation.isPending && revokeMutation.variables === inv.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showInviteModal && (
        <OrgInviteModal
          orgId={currentOrgId}
          orgName={orgName ?? 'your workspace'}
          onDone={() => {
            setShowInviteModal(false)
            queryClient.invalidateQueries({ queryKey: INVITES_KEY })
          }}
        />
      )}
    </div>
  )
}
