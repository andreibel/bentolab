import {useState} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {Link} from 'react-router-dom'
import {MailCheck} from 'lucide-react'
import {authApi} from '@/api/auth'
import {Button} from '@/components/ui/Button'
import {Input} from '@/components/ui/Input'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    // Backend silently ignores unknown emails — always show success
    await authApi.forgotPassword(values.email).catch(() => {})
    setSubmittedEmail(values.email)
    setSent(true)
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
          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-subtle">
                <MailCheck className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">Check your inbox</h1>
              <p className="text-sm text-text-secondary">
                If an account exists for <span className="font-medium text-text-primary">{submittedEmail}</span>,
                you'll receive a password reset link within a few minutes.
              </p>
              <p className="text-xs text-text-muted">Didn't get it? Check your spam folder.</p>
              <Link
                to="/login"
                className="mt-2 text-sm font-medium text-primary hover:text-primary-light"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">Forgot your password?</h1>
                <p className="mt-1 text-sm text-text-secondary">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  autoFocus
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Button type="submit" size="lg" loading={isSubmitting} className="mt-2 w-full">
                  Send reset link
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-text-muted">
                Remembered it?{' '}
                <Link to="/login" className="font-medium text-primary hover:text-primary-light">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
