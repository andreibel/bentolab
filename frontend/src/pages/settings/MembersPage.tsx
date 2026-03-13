import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UserPlus, Trash2, Mail, Link2, CheckCircle2 } from 'lucide-react'
import { orgsApi } from '@/api/orgs'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { OrgInviteModal } from '@/components/org/OrgInviteModal'
import type { OrgInvitation } from '@/types/org'

const ROLE_LABELS: Record<string, string> = {
  ORG_MEMBER: 'Member',
  ORG_ADMIN:  'Admin',
  ORG_OWNER:  'Owner',
}

function buildInviteUrl(token: string) {
  return `${window.location.origin}/invite?token=${token}`
}

export default function MembersPage() {
  const { currentOrgId, orgName } = useAuthStore()
  const queryClient = useQueryClient()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const QUERY_KEY = ['invitations', currentOrgId, 'PENDING']

  const { data: pendingInvites = [], isLoading } = useQuery<OrgInvitation[]>({
    queryKey: QUERY_KEY,
    queryFn: () => orgsApi.listInvitations(currentOrgId!, 'PENDING'),
    enabled: !!currentOrgId,
  })

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) =>
      orgsApi.revokeInvitation(currentOrgId!, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Invitation revoked')
    },
    onError: () => toast.error('Could not revoke invitation'),
  })

  const handleCopyLink = async (token: string) => {
    await navigator.clipboard.writeText(buildInviteUrl(token))
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const handleModalDone = () => {
    setShowInviteModal(false)
    queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }

  if (!currentOrgId) return null

  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Members &amp; Invitations</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            Manage who has access to{' '}
            <span className="font-medium text-text-primary">{orgName ?? 'your workspace'}</span>.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowInviteModal(true)}>
          <UserPlus className="h-4 w-4" />
          Invite people
        </Button>
      </div>

      {/* Pending invitations */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Pending invitations</h2>

        {isLoading ? (
          <div className="rounded-xl border border-surface-border p-8 text-center text-sm text-text-muted">
            Loading…
          </div>
        ) : pendingInvites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-surface-border p-8 text-center">
            <UserPlus className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm font-medium text-text-primary">No pending invitations</p>
            <p className="mt-1 text-xs text-text-muted">
              Invite teammates via email or a shareable link.
            </p>
            <Button size="sm" className="mt-4 gap-2" onClick={() => setShowInviteModal(true)}>
              <UserPlus className="h-4 w-4" />
              Invite people
            </Button>
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
      </section>

      {showInviteModal && (
        <OrgInviteModal
          orgId={currentOrgId}
          orgName={orgName ?? 'your workspace'}
          onDone={handleModalDone}
        />
      )}
    </div>
  )
}

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
      {/* Icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-raised">
        {isOpenLink
          ? <Link2 className="h-4 w-4 text-text-muted" />
          : <Mail className="h-4 w-4 text-text-muted" />
        }
      </div>

      {/* Info */}
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

      {/* Type badge */}
      <span className="hidden rounded-full border border-surface-border px-2 py-0.5 text-xs text-text-muted sm:inline-flex">
        {isOpenLink ? 'Link' : 'Email'}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {isOpenLink && (
          <button
            onClick={onCopyLink}
            title="Copy invite link"
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-raised hover:text-primary"
          >
            {copied
              ? <CheckCircle2 className="h-4 w-4 text-green-500" />
              : <Link2 className="h-4 w-4" />
            }
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
