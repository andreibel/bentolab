import {KeyboardEvent, useRef, useState} from 'react'
import {toast} from 'sonner'
import {Check, ChevronRight, Copy, Link2, Loader2, Mail, X} from 'lucide-react'
import {orgsApi} from '@/api/orgs'
import {Button} from '@/components/ui/Button'
import type {OrgRole} from '@/types/org'

interface Props {
  orgId: string
  orgName: string
  onDone: () => void
}

type Tab = 'link' | 'email'

const ROLE_OPTIONS: { value: OrgRole; label: string; description: string }[] = [
  { value: 'ORG_MEMBER', label: 'Member', description: 'Can view and work on issues' },
  { value: 'ORG_ADMIN',  label: 'Admin',  description: 'Can manage members and settings' },
]

function roleLabel(role: OrgRole) {
  return ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role
}

function buildInviteUrl(token: string) {
  return `${window.location.origin}/invite?token=${token}`
}

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@') && e.includes('.'))
}

export function OrgInviteModal({ orgId, orgName, onDone }: Props) {
  const [tab, setTab] = useState<Tab>('link')

  // ── Link tab ────────────────────────────────────────────────────────────
  const [linkRole, setLinkRole]             = useState<OrgRole>('ORG_MEMBER')
  const [inviteUrl, setInviteUrl]           = useState<string | null>(null)
  const [generatingLink, setGeneratingLink] = useState(false)
  const [copied, setCopied]                 = useState(false)

  // ── Email tab ───────────────────────────────────────────────────────────
  const [emailDraft, setEmailDraft]   = useState('')
  const [emailChips, setEmailChips]   = useState<string[]>([])
  const [emailRole, setEmailRole]     = useState<OrgRole>('ORG_MEMBER')
  const [message, setMessage]         = useState('')
  const [sending, setSending]         = useState(false)
  const [sentEmails, setSentEmails]   = useState<string[]>([])
  const emailInputRef = useRef<HTMLInputElement>(null)

  // ── Link actions ─────────────────────────────────────────────────────────

  const handleGenerateLink = async () => {
    setGeneratingLink(true)
    try {
      const inv = await orgsApi.generateInviteLink(orgId, linkRole)
      setInviteUrl(buildInviteUrl(inv.token))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not generate link')
    } finally {
      setGeneratingLink(false)
    }
  }

  const handleCopy = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Email chip actions ────────────────────────────────────────────────────

  const commitDraft = () => {
    const parsed = parseEmails(emailDraft)
    if (!parsed.length) return
    const unique = parsed.filter((e) => !emailChips.includes(e))
    if (unique.length) setEmailChips((prev) => [...prev, ...unique])
    setEmailDraft('')
  }

  const handleEmailKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', ';', ' '].includes(e.key)) {
      e.preventDefault()
      commitDraft()
    }
    if (e.key === 'Backspace' && emailDraft === '' && emailChips.length > 0) {
      setEmailChips((prev) => prev.slice(0, -1))
    }
  }

  const removeChip = (email: string) =>
    setEmailChips((prev) => prev.filter((e) => e !== email))

  const handleSendAll = async () => {
    // Commit any text still in the draft field
    const draft = parseEmails(emailDraft)
    const all = [...new Set([...emailChips, ...draft])].filter(
      (e) => !sentEmails.includes(e)
    )
    if (!all.length) {
      toast.error('Add at least one email address')
      return
    }
    setSending(true)
    const succeeded: string[] = []
    const failed: string[] = []
    await Promise.allSettled(
      all.map((email) =>
        orgsApi
          .sendInvitation(orgId, email, emailRole, message || undefined)
          .then(() => succeeded.push(email))
          .catch(() => failed.push(email))
      )
    )
    if (succeeded.length) {
      setSentEmails((prev) => [...prev, ...succeeded])
      setEmailChips((prev) => prev.filter((e) => !succeeded.includes(e)))
      setEmailDraft('')
      setMessage('')
      toast.success(
        succeeded.length === 1
          ? `Invitation sent to ${succeeded[0]}`
          : `${succeeded.length} invitations sent`
      )
    }
    if (failed.length) {
      toast.error(`Failed to send to: ${failed.join(', ')}`)
    }
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-md flex-col rounded-2xl border border-surface-border bg-surface shadow-2xl">

        {/* Header */}
        <div className="border-b border-surface-border px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-subtle">
                <img src="/logo.svg" alt="" className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">Invite your team</h2>
              <p className="mt-0.5 text-sm text-text-secondary">
                <span className="font-medium text-text-primary">{orgName}</span> is ready. Bring your team in.
              </p>
            </div>
            <button
              onClick={onDone}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 rounded-lg bg-surface-raised p-1">
            {(['link', 'email'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                  ${tab === t
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                  }`}
              >
                {t === 'link' ? <Link2 className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                {t === 'link' ? 'Share link' : 'Send emails'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'link' ? (
            <div className="flex flex-col gap-4">
              <RoleSelect value={linkRole} onChange={(v) => { setLinkRole(v); setInviteUrl(null) }} />

              {inviteUrl ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1 truncate rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm text-text-secondary font-mono">
                      {inviteUrl}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-surface text-text-muted transition-colors hover:bg-primary-subtle hover:text-primary"
                      title="Copy link"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-text-muted">
                    Anyone with this link can join as <span className="font-medium text-text-secondary">{roleLabel(linkRole)}</span>.
                    Link expires in 7 days.
                  </p>
                  <Button variant="secondary" size="sm" onClick={handleGenerateLink} loading={generatingLink}>
                    Generate new link
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-text-secondary">
                    Generate a shareable link. Anyone with it can join as{' '}
                    <span className="font-medium text-text-primary">{roleLabel(linkRole)}</span>.
                  </p>
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2.5 text-xs text-yellow-700 dark:border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-400">
                    Link invites have no email protection — anyone who gets the link can join.
                  </div>
                  <Button onClick={handleGenerateLink} loading={generatingLink} className="w-full">
                    {generatingLink ? 'Generating…' : 'Generate invite link'}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Multi-email chip input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary">Email addresses</label>
                <div
                  className="flex min-h-[2.75rem] flex-wrap gap-1.5 rounded-lg border border-surface-border bg-surface px-2.5 py-2 focus-within:ring-2 focus-within:ring-primary/40 cursor-text"
                  onClick={() => emailInputRef.current?.focus()}
                >
                  {emailChips.map((email) => (
                    <span
                      key={email}
                      className="flex items-center gap-1 rounded-md bg-primary-subtle px-2 py-0.5 text-xs font-medium text-primary"
                    >
                      {email}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeChip(email) }}
                        className="ml-0.5 rounded hover:text-primary-light"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={emailInputRef}
                    type="text"
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    onKeyDown={handleEmailKeyDown}
                    onBlur={commitDraft}
                    placeholder={emailChips.length === 0 ? 'teammate@company.com, another@…' : ''}
                    className="min-w-[160px] flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                  />
                </div>
                <p className="text-xs text-text-muted">
                  Separate with comma, semicolon, or press Enter. Each invite is locked to that email.
                </p>
              </div>

              <RoleSelect value={emailRole} onChange={setEmailRole} />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary">
                  Personal message <span className="font-normal text-text-muted">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hey! Join our team on Bento…"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm
                    text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <Button
                onClick={handleSendAll}
                loading={sending}
                disabled={emailChips.length === 0 && !emailDraft.trim()}
                className="w-full"
              >
                {sending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                ) : emailChips.length > 1 ? (
                  `Send ${emailChips.length} invitations`
                ) : (
                  'Send invitation'
                )}
              </Button>

              {sentEmails.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium text-text-muted">Sent successfully</p>
                  <div className="flex flex-col gap-1">
                    {sentEmails.map((e) => (
                      <div key={e} className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 dark:bg-green-500/10">
                        <Check className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-text-secondary">{e}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-surface-border px-6 py-4">
          <button
            onClick={onDone}
            className="text-sm text-text-muted transition-colors hover:text-text-primary"
          >
            Skip for now
          </button>
          <Button size="sm" onClick={onDone} className="gap-1.5">
            Go to workspace
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Shared sub-component ─────────────────────────────────────────────────────

function RoleSelect({ value, onChange }: { value: OrgRole; onChange: (v: OrgRole) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-primary">Role</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as OrgRole)}
        className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-text-primary
          focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {ROLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label} — {o.description}
          </option>
        ))}
      </select>
    </div>
  )
}
