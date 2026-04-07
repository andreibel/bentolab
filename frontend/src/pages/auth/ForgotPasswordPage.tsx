import {useRef, useState} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {Link} from 'react-router-dom'
import {MailCheck, ArrowLeft} from 'lucide-react'
import {motion, useReducedMotion} from 'framer-motion'
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
        <motion.div
          ref={cardRef}
          key={sent ? 'success' : 'form'}
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

          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-subtle">
                <MailCheck className="h-7 w-7 text-primary" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">Check your inbox</h1>
                <p className="text-sm text-text-secondary">
                  If an account exists for{' '}
                  <span className="font-medium text-text-primary">{submittedEmail}</span>,
                  you'll receive a reset link within a few minutes.
                </p>
                <p className="mt-1 text-xs text-text-muted">Didn't get it? Check your spam folder.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">Forgot password?</h1>
                <p className="mt-1.5 text-sm text-text-secondary">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@company.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </motion.div>

        {/* Bottom link */}
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
