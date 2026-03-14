import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {Link, useNavigate, useSearchParams} from 'react-router-dom'
import {AlertCircle} from 'lucide-react'
import {toast} from 'sonner'
import {authApi} from '@/api/auth'
import {Button} from '@/components/ui/Button'
import {Input} from '@/components/ui/Input'

const schema = z
  .object({
    newPassword:     z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    try {
      await authApi.resetPassword(token!, values.newPassword)
      toast.success('Password updated — please sign in')
      navigate('/login')
    } catch {
      toast.error('Reset link is invalid or has expired')
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col bg-surface-muted">
        <header className="flex h-14 items-center border-b border-surface-border bg-surface px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Bento" className="h-7 w-7" />
            <span className="text-[1.05rem] font-bold tracking-[-0.5px] text-text-primary">bento</span>
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="flex max-w-sm flex-col items-center gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <h1 className="text-xl font-bold text-text-primary">Invalid reset link</h1>
            <p className="text-sm text-text-secondary">This link is missing a reset token. Please request a new one.</p>
            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary-light">
              Request new link
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <header className="flex h-14 items-center border-b border-surface-border bg-surface px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Bento" className="h-7 w-7" />
          <span className="text-[1.05rem] font-bold tracking-[-0.5px] text-text-primary">bento</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Set new password</h1>
            <p className="mt-1 text-sm text-text-secondary">Choose a strong password — at least 8 characters.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              autoFocus
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <Input
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button type="submit" size="lg" loading={isSubmitting} className="mt-2 w-full">
              Update password
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
