import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/Button'

type State = 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [state, setState] = useState<State>(token ? 'loading' : 'error')
  const [resending, setResending] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const [resendSent, setResendSent] = useState(false)

  useEffect(() => {
    if (!token) return
    authApi.verifyEmail(token)
      .then(() => setState('success'))
      .catch(() => setState('error'))
  }, [token])

  const handleResend = async () => {
    if (!resendEmail) return
    setResending(true)
    await authApi.resendVerification(resendEmail).catch(() => {})
    setResending(false)
    setResendSent(true)
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
        <div className="w-full max-w-sm text-center">

          {state === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-text-secondary">Verifying your email…</p>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">Email verified!</h1>
              <p className="text-sm text-text-secondary">
                Your email address has been confirmed. You're all set.
              </p>
              <Link to="/login">
                <Button size="lg" className="mt-2">
                  Sign in to Bento
                </Button>
              </Link>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                <AlertCircle className="h-7 w-7 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                {token ? 'Link expired or invalid' : 'Invalid verification link'}
              </h1>
              <p className="text-sm text-text-secondary">
                {token
                  ? 'This verification link has expired or already been used. Request a new one below.'
                  : 'No verification token was found in this link.'}
              </p>

              {!resendSent ? (
                <div className="mt-2 flex w-full flex-col gap-2">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                  <Button
                    type="button"
                    size="lg"
                    loading={resending}
                    disabled={!resendEmail}
                    onClick={handleResend}
                    className="w-full"
                  >
                    Resend verification email
                  </Button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-emerald-600">
                  Sent! Check your inbox and spam folder.
                </p>
              )}

              <Link to="/login" className="text-sm text-text-muted hover:text-text-primary">
                Back to sign in
              </Link>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
