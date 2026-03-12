import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MailCheck } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    try {
      const data = await authApi.register(values)
      setAuth(data)
      if (!data.user.emailVerified) setVerifyEmail(data.user.email)
      navigate(data.user.currentOrgId ? '/boards' : '/org/new')
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Could not create account'
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
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-light">
            Sign in
          </Link>
        </span>
      </header>

      {/* Form */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {verifyEmail && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary-subtle px-4 py-3">
              <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm text-text-secondary">
                We sent a verification email to{' '}
                <span className="font-medium text-text-primary">{verifyEmail}</span>.
                Please check your inbox.
              </p>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Get started with Bento for free
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                autoComplete="given-name"
                placeholder="John"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Last name"
                autoComplete="family-name"
                placeholder="Doe"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" size="lg" loading={isSubmitting} className="mt-2 w-full">
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-text-muted">
            By signing up you agree to our{' '}
            <a href="#" className="underline hover:text-text-secondary">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline hover:text-text-secondary">Privacy Policy</a>.
          </p>
        </div>
      </main>
    </div>
  )
}
