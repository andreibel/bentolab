import {useEffect, useRef, useState} from 'react'
import {buildOrgUrl} from '@/utils/subdomain'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {Link} from 'react-router-dom'
import {toast} from 'sonner'
import {motion, useReducedMotion} from 'framer-motion'
import {orgsApi} from '@/api/orgs'
import {authApi} from '@/api/auth'
import {useAuthStore} from '@/stores/authStore'
import {Button} from '@/components/ui/Button'
import {Input} from '@/components/ui/Input'
import {OrgInviteModal} from '@/components/org/OrgInviteModal'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(20, 'Slug must be 20 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  description: z.string().max(200).optional(),
})

type FormValues = z.infer<typeof schema>

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20)
}

export default function CreateOrgPage() {
  const { setOrgContext, logout } = useAuthStore()
  const [createdOrg, setCreatedOrg] = useState<{ id: string; name: string; slug: string } | null>(null)
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
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const nameValue = watch('name', '')

  useEffect(() => {
    setValue('slug', toSlug(nameValue), { shouldValidate: false })
  }, [nameValue, setValue])

  const onSubmit = async (values: FormValues) => {
    try {
      const org = await orgsApi.create({
        name: values.name,
        slug: values.slug,
        description: values.description,
      })
      const { accessToken } = await authApi.switchOrg(org.id)
      setOrgContext(org.id, 'ORG_OWNER', org.slug, accessToken, org.name)
      setCreatedOrg({ id: org.id, name: org.name, slug: org.slug })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not create organization'
      toast.error(message)
    }
  }

  if (createdOrg) {
    return (
      <>
        <div className="flex min-h-screen flex-col bg-surface-muted" />
        <OrgInviteModal
          orgId={createdOrg.id}
          orgName={createdOrg.name}
          onDone={() => { window.location.href = buildOrgUrl(createdOrg.slug, '/boards') }}
        />
      </>
    )
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

          {/* Step indicator */}
          <div className="mb-7 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
              ✓
            </div>
            <div className="h-px flex-1 bg-surface-border" />
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              2
            </div>
            <div className="h-px flex-1 bg-surface-border" />
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-border text-xs font-semibold text-text-muted">
              3
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">
              Create your organization
            </h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              This is your team's workspace in Bento.
            </p>
          </div>

          <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Organization name"
              placeholder="Acme Corp"
              autoFocus
              error={errors.name?.message}
              {...register('name')}
            />

            <div className="flex flex-col gap-1.5">
              <Input
                label="Slug"
                placeholder="acme-corp"
                error={errors.slug?.message}
                {...register('slug')}
              />
              <p className="text-xs text-text-muted">
                Your workspace URL:{' '}
                <span className="font-medium text-text-secondary">
                  bento.io/<span>{watch('slug') || 'your-slug'}</span>
                </span>
              </p>
            </div>

            <Input
              label="Description"
              placeholder="What does your team do? (optional)"
              error={errors.description?.message}
              {...register('description')}
            />

            <Button type="submit" size="lg" loading={isSubmitting} className="mt-2 w-full">
              Create organization
            </Button>
          </form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-5 text-center text-xs text-text-muted"
        >
          <button
            type="button"
            onClick={logout}
            className="font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            Sign out
          </button>
        </motion.p>
      </div>
    </div>
  )
}
