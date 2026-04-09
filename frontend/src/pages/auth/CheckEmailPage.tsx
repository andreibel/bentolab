import {useRef, useState} from 'react'
import {Link, useSearchParams} from 'react-router-dom'
import {ArrowLeft, Mail, Send} from 'lucide-react'
import {motion, useReducedMotion} from 'framer-motion'
import {useTranslation} from 'react-i18next'
import {authApi} from '@/api/auth'
import {Button} from '@/components/ui/Button'

export default function CheckEmailPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const reduceMotion = useReducedMotion()

  const cardRef = useRef<HTMLDivElement>(null)
  const [glow, setGlow] = useState({ x: 50, y: 50, visible: false })
  const [resending, setResending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    setGlow({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      visible: true,
    })
  }

  const handleResend = async () => {
    if (!email || resending) return
    setResending(true)
    await authApi.resendVerification(email).catch(() => {})
    setResending(false)
    setSent(true)
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% -10%, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 70%), var(--color-surface-muted)',
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

          <div className="flex flex-col items-center gap-5 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
            >
              <Mail className="h-8 w-8 text-primary" />
            </motion.div>

            {/* Text */}
            <div className="flex flex-col gap-1.5">
              <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">
                {t('auth.checkEmail.title')}
              </h1>
              <p className="text-sm text-text-secondary">
                {t('auth.checkEmail.desc')}{' '}
                {email && (
                  <span className="font-semibold text-text-primary break-all">{email}</span>
                )}
                {'. '}
                {t('auth.checkEmail.descSuffix')}
              </p>
            </div>

            {/* Resend */}
            <div className="w-full pt-1">
              {sent ? (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 text-sm text-emerald-600"
                >
                  <Send className="h-3.5 w-3.5" />
                  {t('auth.checkEmail.sent')}
                </motion.p>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-text-muted">{t('auth.checkEmail.didntReceive')}</p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={resending}
                    onClick={handleResend}
                    disabled={!email}
                    className="w-full"
                  >
                    {t('auth.checkEmail.resend')}
                  </Button>
                </div>
              )}
            </div>
          </div>
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
            {t('auth.checkEmail.backToSignIn')}
          </Link>
        </motion.p>
      </div>
    </div>
  )
}