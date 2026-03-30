import {Moon, Plus, Search, Sun} from 'lucide-react'
import {useAuthStore} from '@/stores/authStore'
import {useUIStore} from '@/stores/uiStore'
import {NotificationBell} from './NotificationBell'

interface HeaderProps {
  title?: string
  onCreateClick?: () => void
  onSearchClick?: () => void
}

export function Header({ title, onCreateClick, onSearchClick }: HeaderProps) {
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

      {/* Center: search bar — GitLab style */}
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
        {/* Create */}
        <button
          onClick={onCreateClick}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary-light"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Create</span>
        </button>

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
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
          {initials}
        </div>
      </div>
    </header>
  )
}
