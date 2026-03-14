import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {Link, useNavigate, useSearchParams} from 'react-router-dom'
import {toast} from 'sonner'
import {authApi} from '@/api/auth'
import {useAuthStore} from '@/stores/authStore'
import {Button} from '@/components/ui/Button'
import {Input} from '@/components/ui/Input'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const setAuth = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    try {
      const data = await authApi.login(values.email, values.password)
      setAuth(data)
      if (redirect) {
        navigate(redirect)
      } else {
        navigate(data.user.currentOrgId ? '/boards' : '/org/new')
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Invalid email or password'
      toast.error(msg)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b border-surface-border bg-surface px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Bento" className="h-7 w-7" />
          <span className="text-[1.05rem] font-bold tracking-[-0.5px] text-text-primary">bento</span>
        </Link>
        <span className="text-sm text-text-secondary">
          No account?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary-light">
            Sign up
          </Link>
        </span>
      </header>

      {/* Form */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Sign in to your Bento workspace
            </p>
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
                <Link
                  to="/forgot-password"
                  className="text-xs text-text-muted hover:text-primary"
                >
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
      </main>
    </div>
  )
}
