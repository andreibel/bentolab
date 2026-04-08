import {useRef, useState} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {Link, useNavigate, useSearchParams} from 'react-router-dom'
import {toast} from 'sonner'
import {motion, useReducedMotion} from 'framer-motion'
import {useTranslation} from 'react-i18next'
import {authApi} from '@/api/auth'
import {useAuthStore} from '@/stores/authStore'
import {Button} from '@/components/ui/Button'
import {Input} from '@/components/ui/Input'
import {getOrgSlug, buildOrgUrl} from '@/utils/subdomain'
import {ArrowRight} from 'lucide-react'

// ── Subdomain (org-scoped) login ───────────────────────────────────────────────

const credSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type CredValues = z.infer<typeof credSchema>

function OrgLogin({ orgSlug }: { orgSlug: string }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const setAuth = useAuthStore((s) => s.setAuth)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<CredValues>({ resolver: zodResolver(credSchema) })

  const onSubmit = async (values: CredValues) => {
    try {
      const data = await authApi.login(values.email, values.password, orgSlug)
      setAuth(data)
      navigate(redirect ?? (data.user.currentOrgId ? '/boards' : '/org/new'))
    } catch {
      toast.error(t('auth.login.invalidCredentials'))
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-muted px-3 py-1 text-sm text-text-secondary">
          <span className="h-2 w-2 rounded-full bg-primary" />
          {orgSlug}
        </div>
        <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">{t('auth.login.welcomeBack')}</h1>
        <p className="mt-1.5 text-sm text-text-secondary">{t('auth.login.continueWorkspace')}</p>
      </div>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label={t('auth.login.email')}
          type="email"
          autoFocus
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-primary" htmlFor="password">
              {t('auth.login.password')}
            </label>
            <Link to="/forgot-password" className="text-xs text-text-muted transition-colors hover:text-primary">
              {t('auth.login.forgotPassword')}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
          {t('auth.login.signIn')}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-text-muted">
        {t('auth.login.bySigningIn')}{' '}
        <a href="#" className="underline hover:text-text-secondary">{t('auth.login.termsOfService')}</a>
        {' '}{t('auth.login.and')}{' '}
        <a href="#" className="underline hover:text-text-secondary">{t('auth.login.privacyPolicy')}</a>.
      </p>
    </>
  )
}

// ── Root domain — workspace URL entry ─────────────────────────────────────────

const slugSchema = z.object({
  slug: z
    .string()
    .min(2, 'Workspace URL must be at least 2 characters')
    .max(48, 'Workspace URL is too long')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
})
type SlugValues = z.infer<typeof slugSchema>

function WorkspaceEntry() {
  const [submitting, setSubmitting] = useState(false)
  const { t } = useTranslation()
  const APP_DOMAIN = (import.meta.env.VITE_APP_DOMAIN as string | undefined) ?? 'localhost'

  const { register, handleSubmit, formState: { errors } } =
    useForm<SlugValues>({ resolver: zodResolver(slugSchema) })

  const onSubmit = ({ slug }: SlugValues) => {
    setSubmitting(true)
    window.location.href = buildOrgUrl(slug, '/login')
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">{t('auth.login.signInToBento')}</h1>
        <p className="mt-1.5 text-sm text-text-secondary">{t('auth.login.enterWorkspaceUrl')}</p>
      </div>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">{t('auth.login.workspaceUrl')}</label>
          <div className="flex items-center rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary">
            <input
              autoFocus
              autoComplete="off"
              placeholder="your-workspace"
              className="min-w-0 flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none"
              {...register('slug')}
            />
            <span className="shrink-0 text-text-muted">.{APP_DOMAIN}</span>
          </div>
          {errors.slug && (
            <p className="text-xs text-red-500">{errors.slug.message}</p>
          )}
        </div>

        <Button type="submit" size="lg" loading={submitting} className="mt-1 w-full">
          {t('auth.login.continue')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-text-secondary">
        {t('auth.login.noWorkspace')}{' '}
        <Link to="/register" className="font-medium text-primary transition-colors hover:text-primary-light">
          {t('auth.login.createForFree')}
        </Link>
      </div>
    </>
  )
}

// ── Page shell ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const orgSlug = getOrgSlug()
  const reduceMotion = useReducedMotion()
  const { t: tPage } = useTranslation()

  // Spotlight glow — tracks cursor position relative to the card
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

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 70%), var(--color-surface-muted)',
      }}
    >
      {/* Background orbs — GPU-accelerated, reduced-motion safe */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary"
        style={{ opacity: 0.06, filter: 'blur(90px)' }}
        animate={reduceMotion ? {} : {
          x: [0, 28, -18, 0],
          y: [0, -22, 26, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -right-40 h-[420px] w-[420px] rounded-full bg-primary"
        style={{ opacity: 0.045, filter: 'blur(70px)' }}
        animate={reduceMotion ? {} : {
          x: [0, -22, 16, 0],
          y: [0, 18, -28, 0],
        }}
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
        {/* Form card */}
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
          {orgSlug ? <OrgLogin orgSlug={orgSlug} /> : <WorkspaceEntry />}
        </motion.div>

        {/* Bottom link — only on root domain */}
        {!orgSlug && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-5 text-center text-xs text-text-muted"
          >
            {tPage('auth.login.alreadyHaveWorkspace')}{' '}
            <Link to="/login" className="font-medium text-text-secondary transition-colors hover:text-text-primary">
              {tPage('auth.login.signInWithUrl')}
            </Link>
          </motion.p>
        )}
      </div>
    </div>
  )
}
