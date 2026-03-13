import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Loader2, CheckCircle2, XCircle, Users } from 'lucide-react'
import { orgsApi } from '@/api/orgs'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import type { InvitationPreview } from '@/types/org'

const ROLE_LABELS: Record<string, string> = {
  ORG_MEMBER: 'Member',
  ORG_ADMIN:  'Admin',
  ORG_OWNER:  'Owner',
}

export default function InviteAcceptPage() {
  const [params] = useSearchParams()
  const navigate  = useNavigate()
  const { accessToken, setOrgContext } = useAuthStore()

  const token = params.get('token') ?? ''

  const [preview, setPreview]     = useState<InvitationPreview | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted]   = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)

  const isLoggedIn = !!accessToken

  // ── Load preview (public endpoint, no JWT needed) ──────────────────────
  useEffect(() => {
    if (!token) {
      setLoadError('Missing invitation token.')
      return
    }
    orgsApi.previewInvitation(token)
      .then(setPreview)
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Invitation not found or has expired.')
      })
  }, [token])

  // ── Auto-accept if already logged in (after preview loads) ─────────────
  useEffect(() => {
    if (!preview || !isLoggedIn || accepted) return
    handleAccept()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, isLoggedIn])

  const handleAccept = async () => {
    setAccepting(true)
    setAcceptError(null)
    try {
      const result = await orgsApi.acceptInvitation(token)
      // Switch into the newly joined org
      const { accessToken: newToken } = await authApi.switchOrg(result.orgId)
      setOrgContext(result.orgId, result.orgRole, result.orgSlug, newToken, result.orgName)
      setAccepted(true)
      setTimeout(() => navigate('/boards'), 1500)
    } catch (err: unknown) {
      setAcceptError(err instanceof Error ? err.message : 'Could not accept invitation.')
      setAccepting(false)
    }
  }

  const loginUrl  = `/login?redirect=/invite?token=${encodeURIComponent(token)}`
  const registerUrl = `/register?redirect=/invite?token=${encodeURIComponent(token)}`

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Bento" className="h-8 w-8" />
            <span className="text-lg font-bold tracking-[-0.5px] text-text-primary">bento</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-surface-border bg-surface p-8 shadow-sm">
          {/* Loading preview */}
          {!preview && !loadError && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-text-muted">Loading invitation…</p>
            </div>
          )}

          {/* Load error */}
          {loadError && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <XCircle className="h-10 w-10 text-red-500" />
              <div>
                <p className="font-semibold text-text-primary">Invitation unavailable</p>
                <p className="mt-1 text-sm text-text-secondary">{loadError}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
                Go to Bento
              </Button>
            </div>
          )}

          {/* Preview loaded */}
          {preview && !accepted && (
            <>
              <div className="mb-6 flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-subtle">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-muted">You've been invited to join</p>
                  <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-text-primary">
                    {preview.orgName}
                  </h1>
                  <span className="mt-1 inline-block rounded-full bg-primary-subtle px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {ROLE_LABELS[preview.role] ?? preview.role}
                  </span>
                </div>
                {preview.isEmailProtected && (
                  <p className="text-xs text-text-muted">
                    This invite is for a specific email address.
                    You must sign in or register with the invited email.
                  </p>
                )}
              </div>

              {isLoggedIn ? (
                /* Logged in: show accept button (auto-accept already in progress) */
                <div className="flex flex-col gap-3">
                  {acceptError ? (
                    <>
                      <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        {acceptError}
                      </div>
                      <Button onClick={handleAccept} loading={accepting} className="w-full">
                        Try again
                      </Button>
                    </>
                  ) : (
                    <Button loading={accepting} className="w-full" onClick={handleAccept}>
                      {accepting ? 'Joining…' : 'Accept invitation'}
                    </Button>
                  )}
                </div>
              ) : (
                /* Not logged in: show auth options */
                <div className="flex flex-col gap-3">
                  <Link to={loginUrl}>
                    <Button className="w-full">Sign in to accept</Button>
                  </Link>
                  <Link to={registerUrl}>
                    <Button variant="secondary" className="w-full">Create account to accept</Button>
                  </Link>
                  <p className="text-center text-xs text-text-muted">
                    You'll be redirected back here after signing in.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Success */}
          {accepted && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <div>
                <p className="font-semibold text-text-primary">You're in!</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Taking you to <span className="font-medium">{preview?.orgName}</span>…
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
