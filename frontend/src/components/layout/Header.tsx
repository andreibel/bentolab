import { Bell, Plus, Search, Sun, Moon } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

interface HeaderProps {
  title?: string
  onCreateClick?: () => void
}

export function Header({ title, onCreateClick }: HeaderProps) {
  const { user, orgSlug } = useAuthStore()
  const { theme, toggleTheme } = useUIStore()

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '?'

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-border bg-surface px-5">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
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

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="flex h-8 items-center gap-2 rounded-lg border border-surface-border bg-surface-muted px-3 text-sm text-text-muted transition-colors hover:border-primary/30 hover:text-text-secondary">
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Search…</span>
          <kbd className="hidden rounded border border-surface-border bg-surface px-1 text-[10px] text-text-muted md:inline">
            ⌘K
          </kbd>
        </button>

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
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary">
          <Bell className="h-4 w-4" />
          <span className="absolute end-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>

        {/* User avatar */}
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
          {initials}
        </div>
      </div>
    </header>
  )
}
