import {useEffect, useRef, useState} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {Link, useNavigate, useSearchParams} from 'react-router-dom'
import {CheckCircle2, Loader2, Users, XCircle} from 'lucide-react'
import {motion, useReducedMotion} from 'framer-motion'
import {orgsApi} from '@/api/orgs'
import {authApi} from '@/api/auth'
import {useAuthStore} from '@/stores/authStore'
import {Button} from '@/components/ui/Button'
import {Input} from '@/components/ui/Input'
import type {InvitationPreview} from '@/types/org'

const ROLE_LABELS: Record<string, string> = {
  ORG_MEMBER: 'Member',
  ORG_ADMIN:  'Admin',
  ORG_OWNER:  'Owner',
}

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type LoginValues = z.infer<typeof loginSchema>

// ── Inline login form shown when user is not authenticated ─────────────────────
function InviteLoginForm({
  orgSlug,
  isEmailProtected,
  onSuccess,
}: {
  orgSlug: string
  isEmailProtected: boolean
  onSuccess: () => void
}) {
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loginError, setLoginError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginValues) => {
    setLoginError(null)
    try {
      const data = await authApi.login(values.email, values.password, orgSlug)
      setAuth(data)
      onSuccess()
    } catch {
      setLoginError(
        isEmailProtected
          ? "Invalid credentials. Make sure you're signing in with the email this invite was sent to."
          : 'Invalid email or password.'
      )
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Input
        label="Email"
        type="email"
        autoFocus
        autoComplete="email"
        placeholder="you@company.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password')}
      />
      {loginError && (
        <p className="text-xs text-red-500">{loginError}</p>
      )}
      <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
        Sign in &amp; accept
      </Button>
    </form>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function InviteAcceptPage() {
  const [params] = useSearchParams()
  const navigate  = useNavigate()
  const { accessToken, setOrgContext, logout } = useAuthStore()

  const token = params.get('token') ?? ''

  const [preview, setPreview]         = useState<InvitationPreview | null>(null)
  const [loadError, setLoadError]     = useState<string | null>(null)
  const [accepting, setAccepting]     = useState(false)
  const [accepted, setAccepted]       = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)
  const reduceMotion = useReducedMotion()

  const cardRef = useRef<HTMLDivElement>(null)
  const [glow, setGlow] = useState({ x: 50, y: 50, visible: false })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    setGlow({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      visible: true,
    })
  }

  const isLoggedIn = !!accessToken

  // ── Load preview ────────────────────────────────────────────────────────
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

  // ── Auto-accept once logged in and preview is ready ─────────────────────
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
      const { accessToken: newToken } = await authApi.switchOrg(result.orgId)
      setOrgContext(result.orgId, result.orgRole, result.orgSlug, newToken, result.orgName)
      setAccepted(true)
      setTimeout(() => navigate('/boards'), 1500)
    } catch (err: unknown) {
      setAcceptError(err instanceof Error ? err.message : 'Could not accept invitation.')
      setAccepting(false)
    }
  }

  const registerUrl = `/register?redirect=${encodeURIComponent(`/invite?token=${token}`)}`

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 70%), var(--color-surface-muted)',
      }}
    >
      {/* Background orbs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary"
        style={{ opacity: 0.06, filter: 'blur(90px)' }}
        animate={reduceMotion ? {} : { x: [0, 28, -18, 0], y: [0, -22, 26, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -right-40 h-[420px] w-[420px] rounded-full bg-primary"
        style={{ opacity: 0.045, filter: 'blur(70px)' }}
        animate={reduceMotion ? {} : { x: [0, -22, 16, 0], y: [0, 18, -28, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 flex justify-center"
      >
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Bento" className="h-8 w-8" />
          <span className="text-lg font-bold tracking-[-0.5px] text-text-primary">bento</span>
        </Link>
      </motion.div>

      <div className="w-full max-w-sm">
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-2xl border border-surface-border bg-surface p-8 shadow-sm"
          onMouseMove={reduceMotion ? undefined : handleMouseMove}
          onMouseLeave={reduceMotion ? undefined : () => setGlow(g => ({ ...g, visible: false }))}
        >
          {/* Spotlight overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              opacity: glow.visible ? 1 : 0,
              transition: 'opacity 400ms ease',
              background: `radial-gradient(circle 220px at ${glow.x}% ${glow.y}%, color-mix(in srgb, var(--color-primary) 9%, transparent), transparent 75%)`,
            }}
          />

          {/* Loading preview */}
          {!preview && !loadError && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-text-muted">Loading invitation…</p>
            </div>
          )}

          {/* Load error */}
          {loadError && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
                <XCircle className="h-7 w-7 text-red-400" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-semibold text-text-primary">Invitation unavailable</p>
                <p className="text-sm text-text-secondary">{loadError}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
                Go to Bento
              </Button>
            </div>
          )}

          {/* Preview loaded */}
          {preview && !accepted && (
            <>
              {/* Org identity header */}
              <div className="mb-6 flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-subtle">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-text-muted">You've been invited to join</p>
                  <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">
                    {preview.orgName}
                  </h1>
                  <span className="mt-0.5 inline-block rounded-full bg-primary-subtle px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {ROLE_LABELS[preview.role] ?? preview.role}
                  </span>
                </div>
                {preview.isEmailProtected && (
                  <p className="text-xs text-text-muted">
                    This invite is for a specific email address. Sign in with that email to accept.
                  </p>
                )}
              </div>

              {isLoggedIn ? (
                /* Already logged in — accept button (auto-accept fires via effect) */
                <div className="flex flex-col gap-3">
                  {acceptError && (
                    <>
                      <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        {acceptError}
                      </div>
                      {preview.isEmailProtected && (
                        <button
                          type="button"
                          className="text-xs text-text-muted underline hover:text-text-secondary"
                          onClick={() => logout()}
                        >
                          Sign in with a different account
                        </button>
                      )}
                    </>
                  )}
                  <Button onClick={handleAccept} loading={accepting} className="w-full">
                    {accepting ? 'Joining…' : acceptError ? 'Try again' : 'Accept invitation'}
                  </Button>
                </div>
              ) : (
                /* Not logged in — inline login using the org slug from the preview */
                <>
                  <div className="mb-4 border-t border-surface-border pt-5">
                    <p className="mb-4 text-center text-sm font-medium text-text-secondary">
                      Sign in to accept
                    </p>
                    <InviteLoginForm
                      orgSlug={preview.orgSlug}
                      isEmailProtected={preview.isEmailProtected}
                      onSuccess={handleAccept}
                    />
                  </div>
                  <p className="mt-4 text-center text-xs text-text-muted">
                    No account?{' '}
                    <Link
                      to={registerUrl}
                      className="font-medium text-primary transition-colors hover:text-primary-light"
                    >
                      Create one for free
                    </Link>
                  </p>
                </>
              )}
            </>
          )}

          {/* Success */}
          {accepted && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[1.75rem] font-bold tracking-tight text-text-primary">You're in!</p>
                <p className="text-sm text-text-secondary">
                  Taking you to <span className="font-medium">{preview?.orgName}</span>…
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
