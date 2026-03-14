import {useEffect} from 'react'
import {NavLink, useLocation, useMatch, useNavigate} from 'react-router-dom'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {orgsApi} from '@/api/orgs'
import {authApi} from '@/api/auth'
import {useBoards} from '@/api/boards'
import {queryKeys} from '@/api/queryKeys'
import type {OrgListItem} from '@/types/org'
import type {Board} from '@/types/board'
import {toast} from 'sonner'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleDot,
  Inbox,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Plus,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  User,
  Users,
  Zap,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Tooltip from '@radix-ui/react-tooltip'
import {useAuthStore} from '@/stores/authStore'
import {useUIStore} from '@/stores/uiStore'
import {usePinnedLabs, useRecentLabs} from '@/hooks/usePinnedLabs'
import {cn} from '@/utils/cn'

// ─── Lab color (deterministic from id) ───────────────────────────────────────

const LAB_PALETTE = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16',
]

function labColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return LAB_PALETTE[Math.abs(h) % LAB_PALETTE.length]
}

// ─── Settings nav ─────────────────────────────────────────────────────────────

const settingsGroups = [
  {
    label: 'Organization',
    items: [
      { label: 'General',     icon: SlidersHorizontal, to: '/settings/org'         },
      { label: 'Members',     icon: Users,             to: '/settings/members'     },
      { label: 'Labels',      icon: Tags,              to: '/settings/labels'      },
      { label: 'Security',    icon: ShieldCheck,       to: '/settings/security'    },
      { label: 'Automations', icon: Zap,               to: '/settings/automations' },
    ],
  },
  {
    label: 'Personal',
    items: [
      { label: 'Profile', icon: User, to: '/settings/profile' },
    ],
  },
]

// ─── Settings sidebar ─────────────────────────────────────────────────────────

function SettingsSidebar() {
  const navigate = useNavigate()
  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-e border-surface-border bg-surface-muted">
      <div className="flex h-14 shrink-0 items-center border-b border-surface-border px-3">
        <button
          onClick={() => navigate('/boards')}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-border hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          <img src="/logo.svg" alt="Bento" className="h-5 w-5 rounded" />
          <span className="font-bold tracking-tight text-text-primary">bentolab</span>
        </button>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-text-muted" />
          <span className="text-sm font-semibold text-text-primary">Settings</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {settingsGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-subtle text-primary'
                        : 'text-text-secondary hover:bg-surface-border hover:text-text-primary'
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}

// ─── Org switcher ─────────────────────────────────────────────────────────────

function OrgSwitcher({ collapsed }: { collapsed: boolean }) {
  const { orgName, orgSlug, orgRole, currentOrgId, setOrgContext } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: orgs, isLoading } = useQuery({
    queryKey: queryKeys.orgs.all(),
    queryFn: () => orgsApi.list(),
  })

  const displayName = orgName ?? orgSlug ?? 'No organization'
  const initials = displayName.slice(0, 2).toUpperCase()

  const handleSwitch = async (org: OrgListItem) => {
    if (org.id === currentOrgId) return
    try {
      const { accessToken } = await authApi.switchOrg(org.id)
      setOrgContext(org.id, '', org.slug, accessToken, org.name)
      queryClient.invalidateQueries()
      navigate('/boards')
    } catch {
      toast.error('Failed to switch organization')
    }
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start transition-colors hover:bg-surface-border',
            collapsed && 'justify-center'
          )}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-white">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-text-primary">{displayName}</p>
                <p className="text-[10px] text-text-muted">{orgRole ?? '—'}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-muted" />
            </>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="right"
          align="start"
          sideOffset={8}
          className="z-50 min-w-[220px] rounded-lg border border-surface-border bg-surface p-1 shadow-lg"
        >
          <div className="mb-1 px-2 py-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Organizations
            </p>
          </div>

          {isLoading && <div className="px-2 py-2 text-xs text-text-muted">Loading…</div>}

          {orgs?.map((org) => {
            const isCurrent = org.id === currentOrgId
            return (
              <DropdownMenu.Item
                key={org.id}
                onSelect={() => handleSwitch(org)}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm outline-none',
                  isCurrent
                    ? 'bg-primary-subtle text-primary'
                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                )}
              >
                <div className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white',
                  isCurrent ? 'bg-primary' : 'bg-text-muted'
                )}>
                  {org.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{org.name}</p>
                  <p className="text-[10px] text-text-muted">{org.slug}</p>
                </div>
                {isCurrent && <span className="text-[10px] font-semibold text-primary">Active</span>}
              </DropdownMenu.Item>
            )
          })}

          <DropdownMenu.Separator className="my-1 h-px bg-surface-border" />
          <DropdownMenu.Item
            onSelect={() => navigate('/org/new')}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary outline-none hover:bg-surface-muted hover:text-text-primary"
          >
            <Plus className="h-4 w-4" />
            Create organization
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

// ─── Lab item ─────────────────────────────────────────────────────────────────

function LabItem({
  board,
  collapsed,
  isPinned,
  onPinToggle,
}: {
  board: Board
  collapsed: boolean
  isPinned: boolean
  onPinToggle: (id: string) => void
}) {
  const color = labColor(board.id)

  const dot = (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
      style={{ backgroundColor: color + '22' }}
    >
      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
    </span>
  )

  if (collapsed) {
    return (
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <NavLink
            to={`/boards/${board.id}`}
            className={({ isActive }) =>
              cn(
                'flex justify-center rounded-lg p-1.5 transition-colors',
                isActive ? 'bg-primary-subtle' : 'hover:bg-surface-border'
              )
            }
          >
            {dot}
          </NavLink>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={12}
            className="rounded-md bg-text-primary px-2 py-1 text-xs text-white shadow-md"
          >
            {board.name}
            <Tooltip.Arrow className="fill-text-primary" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    )
  }

  return (
    <div className="group relative">
      <NavLink
        to={`/boards/${board.id}`}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-2 rounded-lg px-2 py-1.5 pe-8 text-sm font-medium transition-colors',
            isActive
              ? 'bg-primary-subtle text-primary'
              : 'text-text-secondary hover:bg-surface-border hover:text-text-primary'
          )
        }
      >
        {dot}
        <span className="truncate">{board.name}</span>
      </NavLink>
      <button
        onClick={(e) => { e.preventDefault(); onPinToggle(board.id) }}
        title={isPinned ? 'Unpin' : 'Pin'}
        className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-text-primary"
      >
        {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
      </button>
    </div>
  )
}

// ─── Labs section ─────────────────────────────────────────────────────────────

function LabsSection({
  boards,
  collapsed,
  pinned,
  recent,
  isPinned,
  onPinToggle,
}: {
  boards: Board[]
  collapsed: boolean
  pinned: string[]
  recent: string[]
  isPinned: (id: string) => boolean
  onPinToggle: (id: string) => void
}) {
  const navigate = useNavigate()

  const pinnedBoards = pinned.map((id) => boards.find((b) => b.id === id)).filter(Boolean) as Board[]
  const recentBoards = recent
    .filter((id) => !pinned.includes(id))
    .map((id) => boards.find((b) => b.id === id))
    .filter(Boolean)
    .slice(0, 3) as Board[]
  const otherBoards = boards.filter((b) => !pinned.includes(b.id) && !recent.includes(b.id))

  const group = (label: string, items: Board[]) => (
    <div key={label} className="mb-3">
      {!collapsed && (
        <p className="mb-0.5 px-2 text-[9px] font-semibold uppercase tracking-widest text-text-muted">
          {label}
        </p>
      )}
      <div className="flex flex-col gap-0.5">
        {items.map((b) => (
          <LabItem
            key={b.id}
            board={b}
            collapsed={collapsed}
            isPinned={isPinned(b.id)}
            onPinToggle={onPinToggle}
          />
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      {!collapsed && (
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Labs</span>
          <button
            onClick={() => navigate('/boards')}
            title="All labs"
            className="rounded p-0.5 text-text-muted hover:text-text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {pinnedBoards.length > 0 && group('Pinned', pinnedBoards)}
      {recentBoards.length > 0 && group('Recent', recentBoards)}
      {otherBoards.length > 0 && group(
        pinnedBoards.length > 0 || recentBoards.length > 0 ? 'All' : '',
        otherBoards,
      )}

      {boards.length === 0 && !collapsed && (
        <button
          onClick={() => navigate('/boards')}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-text-muted hover:bg-surface-border hover:text-text-primary"
        >
          <Plus className="h-4 w-4" />
          Create your first lab
        </button>
      )}
    </div>
  )
}

// ─── User panel ───────────────────────────────────────────────────────────────

function UserPanel({ collapsed }: { collapsed: boolean }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '?'

  const handleLogout = async () => {
    try {
      const stored = localStorage.getItem('bento-auth')
      const rt = stored ? JSON.parse(stored)?.state?.refreshToken : null
      if (rt) await authApi.logout(rt)
    } catch { /* ignore */ }
    logout()
    navigate('/login')
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-border',
            collapsed && 'justify-center'
          )}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-[10px] font-semibold text-primary">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-start">
              <p className="truncate text-xs font-medium text-text-primary">
                {user ? `${user.firstName} ${user.lastName}` : '—'}
              </p>
              <p className="truncate text-[10px] text-text-muted">{user?.email}</p>
            </div>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="right"
          align="end"
          sideOffset={8}
          className="z-50 min-w-[180px] rounded-lg border border-surface-border bg-surface p-1 shadow-lg"
        >
          <DropdownMenu.Item
            onSelect={() => navigate('/settings/profile')}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary outline-none hover:bg-surface-muted hover:text-text-primary"
          >
            <Building2 className="h-4 w-4" />
            Profile
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-surface-border" />
          <DropdownMenu.Item
            onSelect={handleLogout}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-500 outline-none hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

// ─── Global nav item ──────────────────────────────────────────────────────────

function GlobalNavItem({
  to,
  icon: Icon,
  label,
  collapsed,
}: {
  to: string
  icon: React.ElementType
  label: string
  collapsed: boolean
}) {
  const content = (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors',
          collapsed && 'justify-center',
          isActive
            ? 'bg-primary-subtle text-primary'
            : 'text-text-muted hover:bg-surface-border hover:text-text-primary'
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )

  if (collapsed) {
    return (
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{content}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={12}
            className="rounded-md bg-text-primary px-2 py-1 text-xs text-white shadow-md"
          >
            {label}
            <Tooltip.Arrow className="fill-text-primary" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    )
  }

  return content
}

// ─── Main sidebar ─────────────────────────────────────────────────────────────

export function Sidebar() {
  const { pathname } = useLocation()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const collapsed = sidebarCollapsed

  const { pinned, togglePin, isPinned } = usePinnedLabs()
  const { recent, trackVisit } = useRecentLabs()

  const { data: boards = [] } = useBoards()

  // Track board visits
  const boardMatch = useMatch({ path: '/boards/:boardId', end: false })
  const activeBoardId = boardMatch?.params?.boardId
  useEffect(() => {
    if (activeBoardId) trackVisit(activeBoardId)
  }, [activeBoardId, trackVisit])

  if (pathname.startsWith('/settings')) {
    return <SettingsSidebar />
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <aside
        className={cn(
          'flex h-screen flex-col border-e border-surface-border bg-surface-muted transition-all duration-200',
          collapsed ? 'w-14' : 'w-56'
        )}
      >
        {/* Brand + toggle */}
        <div
          className={cn(
            'flex h-14 shrink-0 items-center border-b border-surface-border px-3',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Bento" className="h-6 w-6 rounded" />
              <span className="text-sm font-bold tracking-tight text-text-primary">bentolab</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-border hover:text-text-primary"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Org switcher */}
        <div className="border-b border-surface-border px-2 py-2">
          <OrgSwitcher collapsed={collapsed} />
        </div>

        {/* Labs list */}
        <LabsSection
          boards={boards}
          collapsed={collapsed}
          pinned={pinned}
          recent={recent}
          isPinned={isPinned}
          onPinToggle={togglePin}
        />

        {/* Global personal items */}
        <div className={cn('border-t border-surface-border px-2 py-2', collapsed && 'flex flex-col items-center gap-0.5')}>
          <GlobalNavItem to="/my-issues"   icon={CircleDot}    label="My Issues" collapsed={collapsed} />
          <GlobalNavItem to="/inbox"       icon={Inbox}        label="Inbox"     collapsed={collapsed} />
          <GlobalNavItem to="/calendar"    icon={CalendarDays} label="Calendar"  collapsed={collapsed} />
        </div>

        {/* Bottom: settings + user */}
        <div className="border-t border-surface-border px-2 pb-3 pt-2">
          <GlobalNavItem to="/settings/org" icon={Settings} label="Settings" collapsed={collapsed} />
          <div className="mt-1">
            <UserPanel collapsed={collapsed} />
          </div>
        </div>
      </aside>
    </Tooltip.Provider>
  )
}
