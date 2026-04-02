import { useRef, useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, Moon, Plus, Search, Sun } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { NotificationBell } from './NotificationBell'

// ─── Create button ────────────────────────────────────────────────────────────

interface CreateAction {
  label: string
  icon: React.ElementType
  onClick: () => void
}

function CreateButton({ context, all }: { context: CreateAction; all: CreateAction[] }) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 200)
  }
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <div className="flex items-center overflow-hidden rounded-lg bg-primary">
        {/* Context action — plain click, no dropdown involvement */}
        <button
          onClick={context.onClick}
          className="flex h-8 items-center gap-1.5 px-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{context.label}</span>
        </button>

        {/* Divider */}
        <div className="h-4 w-px bg-white/25" />

        {/* Chevron — hover this to open the full dropdown */}
        <DropdownMenu.Trigger asChild>
          <button
            onMouseEnter={() => { cancelClose(); setOpen(true) }}
            onMouseLeave={scheduleClose}
            className="flex h-8 items-center px-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenu.Trigger>
      </div>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="z-50 min-w-44 rounded-lg border border-surface-border bg-surface p-1 shadow-lg"
        >
          <p className="mb-1 px-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Create
          </p>
          {all.map((action) => (
            <DropdownMenu.Item
              key={action.label}
              onSelect={action.onClick}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-text-secondary outline-none hover:bg-surface-muted hover:text-text-primary"
            >
              <action.icon className="h-4 w-4 text-text-muted" />
              {action.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  title?: string
  contextCreate: CreateAction
  allCreates: CreateAction[]
  onSearchClick?: () => void
}

export function Header({ title, contextCreate, allCreates, onSearchClick }: HeaderProps) {
  const { user, orgSlug } = useAuthStore()
  const { theme, toggleTheme } = useUIStore()

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '?'

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-surface-border bg-surface px-5">

      {/* Left: breadcrumb */}
      <div className="flex flex-1 items-center gap-2 text-sm">
        {orgSlug && (
          <>
            <span className="font-medium text-text-muted">{orgSlug}</span>
            {title && (
              <>
                <span className="text-text-muted">/</span>
                <span className="font-medium text-text-primary">{title}</span>
              </>
            )}
          </>
        )}
      </div>

      {/* Center: search bar */}
      <div className="flex w-105 shrink-0 justify-center">
        <button
          onClick={onSearchClick}
          className="flex h-9 w-full items-center gap-2.5 rounded-lg border border-surface-border bg-surface-muted px-3.5 text-sm text-text-muted transition-colors hover:border-primary/40 hover:bg-surface hover:text-text-secondary"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-start">Search or jump to…</span>
          <kbd
            className="rounded border border-surface-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted"
            style={{ boxShadow: '0 2px 0 0 var(--color-surface-border)' }}
          >
            /
          </kbd>
        </button>
      </div>

      {/* Right: actions */}
      <div className="flex flex-1 items-center justify-end gap-2">
        <CreateButton context={contextCreate} all={allCreates} />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* User avatar */}
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`${user.firstName} ${user.lastName}`}
            className="h-7 w-7 rounded-full object-cover ring-1 ring-surface-border"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
            {initials}
          </div>
        )}
      </div>
    </header>
  )
}
