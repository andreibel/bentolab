import {useEffect, useState} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {Link, useNavigate} from 'react-router-dom'
import {toast} from 'sonner'
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
  const navigate = useNavigate()
  const { setOrgContext, logout } = useAuthStore()
  const [createdOrg, setCreatedOrg] = useState<{ id: string; name: string } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const nameValue = watch('name', '')

  // Auto-generate slug from name
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
      // Switch org context — auth service issues a new JWT with orgId embedded
      const { accessToken } = await authApi.switchOrg(org.id)
      setOrgContext(org.id, 'ORG_OWNER', org.slug, accessToken, org.name)
      setCreatedOrg({ id: org.id, name: org.name })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not create organization'
      toast.error(message)
    }
  }

  if (createdOrg) {
    return (
      <>
        {/* Keep the page behind the modal so the transition is smooth */}
        <div className="flex min-h-screen flex-col bg-surface-muted" />
        <OrgInviteModal
          orgId={createdOrg.id}
          orgName={createdOrg.name}
          onDone={() => navigate('/boards')}
        />
      </>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b border-surface-border bg-surface px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Bento" className="h-7 w-7" />
          <span className="text-[1.05rem] font-bold tracking-[-0.5px] text-text-primary">bento</span>
        </Link>
        <button
          onClick={logout}
          className="text-sm text-text-muted transition-colors hover:text-text-secondary"
        >
          Sign out
        </button>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Step indicator */}
          <div className="mb-8 flex items-center gap-2">
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

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Create your organization
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              This is your team's workspace in Bento.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
        </div>
      </main>
    </div>
  )
}
