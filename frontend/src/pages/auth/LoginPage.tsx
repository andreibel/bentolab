import {useState} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {Link, useNavigate, useSearchParams} from 'react-router-dom'
import {toast} from 'sonner'
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
      toast.error('Invalid email or password')
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface px-3 py-1 text-sm text-text-secondary">
          <span className="h-2 w-2 rounded-full bg-primary" />
          {orgSlug}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Welcome back</h1>
        <p className="mt-1 text-sm text-text-secondary">Sign in to your workspace</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-primary" htmlFor="password">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-text-muted hover:text-primary">
              Forgot password?
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

        <Button type="submit" size="lg" loading={isSubmitting} className="mt-2 w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-text-muted">
        By signing in you agree to our{' '}
        <a href="#" className="underline hover:text-text-secondary">Terms of Service</a>
        {' '}and{' '}
        <a href="#" className="underline hover:text-text-secondary">Privacy Policy</a>.
      </p>
    </div>
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
  const APP_DOMAIN = (import.meta.env.VITE_APP_DOMAIN as string | undefined) ?? 'localhost'

  const { register, handleSubmit, watch, formState: { errors } } =
    useForm<SlugValues>({ resolver: zodResolver(slugSchema) })

  const slug = watch('slug') ?? ''

  const onSubmit = ({ slug }: SlugValues) => {
    setSubmitting(true)
    window.location.href = buildOrgUrl(slug, '/login')
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Sign in to Bento</h1>
        <p className="mt-1 text-sm text-text-secondary">Enter your workspace URL to continue</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Workspace URL</label>
          <div className="flex items-center rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
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
          {slug && !errors.slug && (
            <p className="text-xs text-text-muted">
              {slug}.{APP_DOMAIN}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">
          Continue
          <ArrowRight className="ms-2 h-4 w-4" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Don't have a workspace?{' '}
        <Link to="/register" className="font-medium text-primary hover:text-primary-light">
          Create one
        </Link>
      </p>
    </div>
  )
}

// ── Page shell ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const orgSlug = getOrgSlug()

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <header className="flex h-14 items-center justify-between border-b border-surface-border bg-surface px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Bento" className="h-7 w-7" />
          <span className="text-[1.05rem] font-bold tracking-[-0.5px] text-text-primary">bento</span>
        </Link>
        {!orgSlug && (
          <span className="text-sm text-text-secondary">
            No account?{' '}
            <Link to="/register" className="font-medium text-primary hover:text-primary-light">
              Sign up
            </Link>
          </span>
        )}
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {orgSlug ? <OrgLogin orgSlug={orgSlug} /> : <WorkspaceEntry />}
      </main>
    </div>
  )
}
