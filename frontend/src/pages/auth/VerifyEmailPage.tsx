import {useEffect, useRef, useState} from 'react'
import {Link, useSearchParams} from 'react-router-dom'
import {AlertCircle, ArrowLeft, CheckCircle2, Loader2} from 'lucide-react'
import {motion, useReducedMotion} from 'framer-motion'
import {authApi} from '@/api/auth'
import {Button} from '@/components/ui/Button'
import {Input} from '@/components/ui/Input'

type State = 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [state, setState] = useState<State>(token ? 'loading' : 'error')
  const [resending, setResending] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const [resendSent, setResendSent] = useState(false)
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
          key={state}
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

          {state === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-text-secondary">Verifying your email…</p>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">Email verified!</h1>
                <p className="text-sm text-text-secondary">
                  Your email address has been confirmed. You're all set.
                </p>
              </div>
              <Link to="/login" className="mt-1 w-full">
                <Button size="lg" className="w-full">Sign in to Bento</Button>
              </Link>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
                <AlertCircle className="h-7 w-7 text-red-400" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">
                  {token ? 'Link expired' : 'Invalid link'}
                </h1>
                <p className="text-sm text-text-secondary">
                  {token
                    ? 'This verification link has expired or already been used. Request a new one below.'
                    : 'No verification token was found in this link.'}
                </p>
              </div>

              {!resendSent ? (
                <div className="mt-1 flex w-full flex-col gap-3">
                  <Input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your email"
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
                <p className="mt-1 text-sm text-emerald-600">
                  Sent! Check your inbox and spam folder.
                </p>
              )}
            </div>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-5 text-center text-xs text-text-muted"
        >
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </motion.p>
      </div>
    </div>
  )
}
