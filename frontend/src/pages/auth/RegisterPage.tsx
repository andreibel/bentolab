import {useRef, useState} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {Link, useNavigate} from 'react-router-dom'
import {toast} from 'sonner'
import {MailCheck} from 'lucide-react'
import {motion, useReducedMotion} from 'framer-motion'
import {useTranslation} from 'react-i18next'
import {authApi} from '@/api/auth'
import {useAuthStore} from '@/stores/authStore'
import {Button} from '@/components/ui/Button'
import {Input} from '@/components/ui/Input'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null)
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
    try {
      const data = await authApi.register(values)
      setAuth(data)
      if (!data.user.emailVerified) setVerifyEmail(data.user.email)
      navigate(data.user.currentOrgId ? '/boards' : '/org/new')
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : t('auth.register.couldNotCreate')
      toast.error(msg)
    }
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

          {verifyEmail && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary-subtle px-4 py-3">
              <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm text-text-secondary">
                {t('auth.register.verifyEmailDesc', { email: verifyEmail })}
              </p>
            </div>
          )}

          <div className="mb-6 text-center">
            <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">{t('auth.register.title')}</h1>
            <p className="mt-1.5 text-sm text-text-secondary">{t('auth.register.subtitle')}</p>
          </div>

          <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('auth.register.firstName')}
                autoFocus
                autoComplete="given-name"
                placeholder="John"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label={t('auth.register.lastName')}
                autoComplete="family-name"
                placeholder="Doe"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>
            <Input
              label={t('auth.register.email')}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label={t('auth.register.password')}
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
              {t('auth.register.createAccount')}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-text-muted">
            {t('auth.login.bySigningIn')}{' '}
            <a href="#" className="underline hover:text-text-secondary">{t('auth.login.termsOfService')}</a>
            {' '}{t('auth.login.and')}{' '}
            <a href="#" className="underline hover:text-text-secondary">{t('auth.login.privacyPolicy')}</a>.
          </p>
        </motion.div>

        {/* Bottom link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-5 text-center text-xs text-text-muted"
        >
          {t('auth.register.alreadyHaveAccount')}{' '}
          <Link to="/login" className="font-medium text-text-secondary transition-colors hover:text-text-primary">
            {t('auth.register.signIn')}
          </Link>
        </motion.p>
      </div>
    </div>
  )
}
