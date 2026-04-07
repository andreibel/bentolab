import {useState} from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {AlertCircle, Database, Loader2, SlidersHorizontal, ToggleLeft, ToggleRight} from 'lucide-react'
import {toast} from 'sonner'
import {orgsApi} from '@/api/orgs'
import {queryKeys} from '@/api/queryKeys'
import {useAuthStore} from '@/stores/authStore'
import {cn} from '@/utils/cn'

// ─── Toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  value,
  disabled,
  onChange,
}: {
  label: string
  description: string
  value: boolean
  disabled: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="mt-0.5 text-xs text-text-muted">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={cn('shrink-0 transition-colors disabled:opacity-40', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
        title={value ? 'Enabled — click to disable' : 'Disabled — click to enable'}
      >
        {value
          ? <ToggleRight className="h-7 w-7 text-primary" />
          : <ToggleLeft  className="h-7 w-7 text-text-muted" />
        }
      </button>
    </div>
  )
}

// ─── Number input row ─────────────────────────────────────────────────────────

function NumberRow({
  label,
  description,
  value,
  min,
  disabled,
  onChange,
}: {
  label: string
  description: string
  value: number
  min: number
  disabled: boolean
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="mt-0.5 text-xs text-text-muted">{description}</p>
      </div>
      <input
        type="number"
        value={value}
        min={min}
        disabled={disabled}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value)))}
        className="w-24 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-40"
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrgAdvancedPage() {
  const { currentOrgId, orgRole } = useAuthStore()
  const queryClient = useQueryClient()
  const isOwner = orgRole === 'ORG_OWNER'

  const { data: org, isLoading } = useQuery({
    queryKey: queryKeys.orgs.detail(currentOrgId!),
    queryFn: () => orgsApi.get(currentOrgId!),
    enabled: !!currentOrgId,
  })

  const settings = (org as { settings?: Record<string, unknown> } | undefined)?.settings ?? {}

  // Local state mirrors — initialised from API
  const [allowDiscord,    setAllowDiscord]    = useState<boolean>((settings.allowDiscord    as boolean)  ?? true)
  const [allowExport,     setAllowExport]     = useState<boolean>((settings.allowExport     as boolean)  ?? true)
  const [customBranding,  setCustomBranding]  = useState<boolean>((settings.customBranding  as boolean)  ?? false)
  const [ssoEnabled,      setSsoEnabled]      = useState<boolean>((settings.ssoEnabled      as boolean)  ?? false)
  const [maxUsers,        setMaxUsers]        = useState<number>((settings.maxUsers         as number)   ?? 50)
  const [maxBoards,       setMaxBoards]       = useState<number>((settings.maxBoards        as number)   ?? 10)
  const [maxStorageGB,    setMaxStorageGB]    = useState<number>((settings.maxStorageGB      as number)   ?? 10)

  // Sync once org loads
  const [synced, setSynced] = useState(false)
  if (org && !synced && Object.keys(settings).length > 0) {
    setAllowDiscord(  (settings.allowDiscord   as boolean) ?? true)
    setAllowExport(   (settings.allowExport    as boolean) ?? true)
    setCustomBranding((settings.customBranding as boolean) ?? false)
    setSsoEnabled(    (settings.ssoEnabled     as boolean) ?? false)
    setMaxUsers(      (settings.maxUsers       as number)  ?? 50)
    setMaxBoards(     (settings.maxBoards      as number)  ?? 10)
    setMaxStorageGB(  (settings.maxStorageGB   as number)  ?? 10)
    setSynced(true)
  }

  const mutation = useMutation({
    mutationFn: (patch: Parameters<typeof orgsApi.updateSettings>[1]) =>
      orgsApi.updateSettings(currentOrgId!, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgs.detail(currentOrgId!) })
      toast.success('Settings saved')
    },
    onError: () => toast.error('Failed to save settings'),
  })

  function save(patch: Parameters<typeof orgsApi.updateSettings>[1]) {
    mutation.mutate(patch)
  }

  if (!currentOrgId) return null

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Advanced Settings</h1>
          <p className="text-sm text-text-muted">Feature flags and resource limits for this organization.</p>
        </div>
      </div>

      {!isOwner && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-900/20">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Only the organization owner can change these settings.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
        </div>
      ) : (
        <>
          {/* Feature flags */}
          <section className="mb-6 rounded-xl border border-surface-border bg-surface">
            <div className="border-b border-surface-border px-6 py-4">
              <div className="flex items-center gap-2">
                <ToggleRight className="h-4 w-4 text-text-muted" />
                <h2 className="text-sm font-semibold text-text-primary">Features</h2>
                {mutation.isPending && <Loader2 className="ms-auto h-3.5 w-3.5 animate-spin text-text-muted" />}
              </div>
            </div>
            <div className="divide-y divide-surface-border px-6">
              <ToggleRow
                label="Discord notifications"
                description="Allow connecting Discord webhooks for board event alerts."
                value={allowDiscord}
                disabled={!isOwner || mutation.isPending}
                onChange={(v) => { setAllowDiscord(v); save({ allowDiscord: v }) }}
              />
              <ToggleRow
                label="Data export"
                description="Allow members to export board data as CSV or JSON."
                value={allowExport}
                disabled={!isOwner || mutation.isPending}
                onChange={(v) => { setAllowExport(v); save({ allowExport: v }) }}
              />
              <ToggleRow
                label="Custom branding"
                description="Replace Bento logos and colors with your own brand assets."
                value={customBranding}
                disabled={!isOwner || mutation.isPending}
                onChange={(v) => { setCustomBranding(v); save({ customBranding: v }) }}
              />
              <ToggleRow
                label="SSO / SAML"
                description="Require members to authenticate via your identity provider."
                value={ssoEnabled}
                disabled={!isOwner || mutation.isPending}
                onChange={(v) => { setSsoEnabled(v); save({ ssoEnabled: v }) }}
              />
            </div>
          </section>

          {/* Limits */}
          <section className="rounded-xl border border-surface-border bg-surface">
            <div className="border-b border-surface-border px-6 py-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-text-muted" />
                <h2 className="text-sm font-semibold text-text-primary">Limits</h2>
              </div>
            </div>
            <div className="divide-y divide-surface-border px-6">
              <NumberRow
                label="Max members"
                description="Maximum number of users allowed in this organization."
                value={maxUsers}
                min={1}
                disabled={!isOwner || mutation.isPending}
                onChange={(v) => setMaxUsers(v)}
              />
              <NumberRow
                label="Max boards"
                description="Maximum number of boards that can be created."
                value={maxBoards}
                min={1}
                disabled={!isOwner || mutation.isPending}
                onChange={(v) => setMaxBoards(v)}
              />
              <NumberRow
                label="Storage limit (GB)"
                description="Maximum attachment storage for this organization."
                value={maxStorageGB}
                min={0}
                disabled={!isOwner || mutation.isPending}
                onChange={(v) => setMaxStorageGB(v)}
              />
            </div>

            {/* Save limits button — save all at once since they don't auto-save */}
            {isOwner && (
              <div className="flex justify-end border-t border-surface-border px-6 py-4">
                <button
                  onClick={() => save({ maxUsers, maxBoards, maxStorageGB })}
                  disabled={mutation.isPending}
                  className={cn(
                    'flex h-8 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors',
                    'bg-primary text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                >
                  {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save limits
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
