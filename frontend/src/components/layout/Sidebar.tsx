import React, {useEffect, useState} from 'react'
import {NavLink, useLocation, useMatch, useNavigate} from 'react-router-dom'
import {motion} from 'framer-motion'
import {useTranslation} from 'react-i18next'
import {authApi} from '@/api/auth'
import {useBoards} from '@/api/boards'
import type {Board} from '@/types/board'
import {
  ArrowLeft,
  BarChart2,
  Building2,
  Cable,
  CalendarDays,
  ChevronDown,
  CircleDot,
  GanttChart,
  Inbox,
  Kanban,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  SunMoon,
  Tags,
  User,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Tooltip from '@radix-ui/react-tooltip'
import {useAuthStore} from '@/stores/authStore'
import {useUIStore} from '@/stores/uiStore'
import {useRecentLabs} from '@/hooks/usePinnedLabs'
import {cn} from '@/utils/cn'

// ─── Torch highlight shared style ────────────────────────────────────────────

// Visual style only — no transform/position here (would conflict with Framer Motion layout)
const TORCH_STYLE: React.CSSProperties = {
  background: 'radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--color-primary) 70%, transparent) 0%, transparent 68%)',
  filter: 'blur(22px)',
}

// Positioning via margin (not transform) so Framer Motion layoutId animation works correctly
const TORCH_POS: React.CSSProperties = {
  left: 0,
  top: '50%',
  width: '18rem',
  height: '18rem',
  marginLeft: '-6rem',
  marginTop: '-6rem',
}

const TORCH_TRANSITION = { type: 'spring' as const, stiffness: 320, damping: 32 }

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
// Labels are i18n keys resolved at render time inside SettingsSidebar

const settingsGroups = [
  {
    labelKey: 'settingsNav.orgGroup',
    items: [
      { labelKey: 'settingsNav.general',      icon: SlidersHorizontal, to: '/settings/org'          },
      { labelKey: 'settingsNav.members',      icon: Users,             to: '/settings/members'      },
      { labelKey: 'settingsNav.labels',       icon: Tags,              to: '/settings/labels'       },
      { labelKey: 'settingsNav.security',     icon: ShieldCheck,       to: '/settings/security'     },
      { labelKey: 'settingsNav.advanced',     icon: Wrench,            to: '/settings/advanced'     },
      { labelKey: 'settingsNav.automations',  icon: Zap,               to: '/settings/automations'  },
      { labelKey: 'settingsNav.integrations', icon: Cable,             to: '/settings/integrations' },
    ],
  },
  {
    labelKey: 'settingsNav.personalGroup',
    items: [
      { labelKey: 'settingsNav.preferences', icon: SunMoon, to: '/settings/preferences' },
      { labelKey: 'settingsNav.profile',     icon: User,    to: '/settings/profile'     },
    ],
  },
]

// ─── Settings sidebar ─────────────────────────────────────────────────────────

function SettingsSidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { theme } = useUIStore()
  const logoSrc = theme === 'dark' ? '/logo-dark.svg' : '/logo.svg'
  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-e border-surface-border bg-surface-muted">
      <div className="flex h-14 shrink-0 items-center border-b border-surface-border px-3">
        <button
          onClick={() => navigate('/boards')}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-border hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          <img src={logoSrc} alt="Bento" className="h-5 w-5 rounded" />
          <span className="font-bold tracking-tight text-text-primary">bentolab</span>
        </button>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-text-muted" />
          <span className="text-sm font-semibold text-text-primary">{t('settingsNav.title')}</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {settingsGroups.map((group) => (
          <div key={group.labelKey} className="mb-4">
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              {t(group.labelKey)}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'text-primary'
                        : 'text-text-secondary hover:bg-surface-border hover:text-text-primary'
                    )
                  }
                >
                  {({ isActive }: { isActive: boolean }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="settings-torch"
                          className="pointer-events-none absolute rounded-full"
                          style={{ ...TORCH_POS, ...TORCH_STYLE }}
                          transition={TORCH_TRANSITION}
                        />
                      )}
                      <item.icon className="relative z-10 h-4 w-4 shrink-0" />
                      <span className="relative z-10">{t(item.labelKey)}</span>
                    </>
                  )}
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

function OrgDisplay({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation()
  const { orgName, orgSlug, orgRole } = useAuthStore()
  const navigate = useNavigate()

  const displayName = orgName ?? orgSlug ?? 'No organization'
  const initials = displayName.slice(0, 2).toUpperCase()

  const trigger = (
    <DropdownMenu.Trigger asChild>
      <button
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-surface-border',
          collapsed && 'justify-center'
        )}
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary text-[10px] font-bold text-white">
          {initials}
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1 text-start">
              <p className="truncate text-xs font-semibold text-text-primary">{displayName}</p>
              <p className="text-[10px] text-text-muted">{orgSlug ?? orgRole ?? '—'}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-muted" />
          </>
        )}
      </button>
    </DropdownMenu.Trigger>
  )

  const menu = (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        side={collapsed ? 'right' : 'bottom'}
        align={collapsed ? 'start' : 'start'}
        sideOffset={8}
        className="z-50 min-w-45 rounded-lg border border-surface-border bg-surface p-1 shadow-lg"
      >
        <DropdownMenu.Label className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          {displayName}
        </DropdownMenu.Label>
        <DropdownMenu.Separator className="my-1 h-px bg-surface-border" />
        <DropdownMenu.Item
          onSelect={() => navigate('/org/new')}
          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary outline-none hover:bg-surface-muted hover:text-text-primary"
        >
          <Plus className="h-4 w-4" />
          {t('nav.createOrg')}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  )

  return (
    <DropdownMenu.Root>
      {trigger}
      {menu}
    </DropdownMenu.Root>
  )
}

// ─── Recent board item (compact) ─────────────────────────────────────────────

function RecentBoardItem({ board, collapsed }: { board: Board; collapsed: boolean }) {
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
            className="rounded-md border border-surface-border bg-surface px-2 py-1 text-xs text-text-primary shadow-lg"
          >
            {board.name}
            <Tooltip.Arrow className="fill-surface-border" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    )
  }

  return (
    <NavLink
      to={`/boards/${board.id}`}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary-subtle text-primary'
            : 'text-text-secondary hover:bg-surface-border hover:text-text-primary'
        )
      }
    >
      {dot}
      <span className="truncate">{board.name}</span>
    </NavLink>
  )
}

// ─── Boards nav item with dropdown ───────────────────────────────────────────

function BoardsNavItem({ boards, collapsed }: { boards: Board[]; collapsed: boolean }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const isActive = pathname === '/boards' || pathname.startsWith('/boards/')

  const boardsLink = (
    <NavLink
      to="/boards"
      className={cn(
        'relative z-10 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors',
        collapsed && 'justify-center',
        isActive ? 'text-primary' : 'text-text-secondary hover:bg-surface-border hover:text-text-primary'
      )}
    >
      <Kanban className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{t('nav.boards')}</span>}
    </NavLink>
  )

  if (collapsed) {
    return (
      <div className="relative w-full">
        {isActive && (
          <motion.div
            layoutId="sidebar-torch"
            className="pointer-events-none absolute rounded-full"
            style={{ ...TORCH_POS, ...TORCH_STYLE }}
            transition={TORCH_TRANSITION}
          />
        )}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>{boardsLink}</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              side="right"
              sideOffset={12}
              className="rounded-md border border-surface-border bg-surface px-2 py-1 text-xs text-text-primary shadow-lg"
            >
              {t('nav.boards')}
              <Tooltip.Arrow className="fill-surface-border" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    )
  }

  return (
    <div className="relative">
      {isActive && (
        <motion.div
          layoutId="sidebar-torch"
          className="pointer-events-none absolute rounded-full"
          style={{ ...TORCH_POS, ...TORCH_STYLE }}
          transition={TORCH_TRANSITION}
        />
      )}
      <div className="flex items-center">
        <NavLink
          to="/boards"
          className={cn(
            'relative z-10 flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors',
            isActive ? 'text-primary' : 'text-text-secondary hover:bg-surface-border hover:text-text-primary'
          )}
        >
          <Kanban className="h-4 w-4 shrink-0" />
          <span>{t('nav.boards')}</span>
        </NavLink>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded p-1 text-text-muted transition-colors hover:bg-surface-border hover:text-text-primary"
        >
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      {open && (
        <div className="ms-4 mt-0.5 flex flex-col gap-0.5 border-s border-surface-border ps-2">
          {boards.slice(0, 8).map((board) => {
            const color = labColor(board.id)
            return (
              <NavLink
                key={board.id}
                to={`/boards/${board.id}`}
                className={({ isActive: active }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'bg-primary-subtle text-primary'
                      : 'text-text-secondary hover:bg-surface-border hover:text-text-primary'
                  )
                }
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="truncate">{board.name}</span>
              </NavLink>
            )
          })}
          {boards.length > 8 && (
            <button
              onClick={() => { navigate('/boards'); setOpen(false) }}
              className="px-2 py-1 text-start text-xs text-text-muted hover:text-text-primary"
            >
              {t('nav.viewAll', { count: boards.length })}
            </button>
          )}
          <button
            onClick={() => { navigate('/boards'); setOpen(false) }}
            className="flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-surface-border hover:text-text-primary"
          >
            <Plus className="h-3 w-3" />
            {t('nav.newBoard')}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Recent section ──────────────────────────────────────────────────────────

function RecentSection({ boards, recent, collapsed }: { boards: Board[]; recent: string[]; collapsed: boolean }) {
  const { t } = useTranslation()
  const recentBoards = recent
    .map((id) => boards.find((b) => b.id === id))
    .filter(Boolean)
    .slice(0, 3) as Board[]

  if (recentBoards.length === 0) return null

  return (
    <div className="border-b border-surface-border px-2 pb-2 pt-2">
      {!collapsed && (
        <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-widest text-text-muted">
          {t('nav.recent')}
        </p>
      )}
      <div className="flex flex-col gap-0.5">
        {recentBoards.map((b) => (
          <RecentBoardItem key={b.id} board={b} collapsed={collapsed} />
        ))}
      </div>
    </div>
  )
}

// ─── User panel ───────────────────────────────────────────────────────────────

function UserPanel({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation()
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
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={initials}
              className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-surface-border"
            />
          ) : (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-[10px] font-semibold text-primary">
              {initials}
            </div>
          )}
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
          className="z-50 min-w-45 rounded-lg border border-surface-border bg-surface p-1 shadow-lg"
        >
          <DropdownMenu.Item
            onSelect={() => navigate('/settings/profile')}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary outline-none hover:bg-surface-muted hover:text-text-primary"
          >
            <Building2 className="h-4 w-4" />
            {t('nav.profile')}
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-surface-border" />
          <DropdownMenu.Item
            onSelect={handleLogout}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-500 outline-none hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <LogOut className="h-4 w-4" />
            {t('actions.signOut')}
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
  matchPrefix,
}: {
  to: string
  icon: React.ElementType
  label: string
  collapsed: boolean
  matchPrefix?: string
}) {
  const { pathname } = useLocation()
  const isActive = matchPrefix
    ? pathname.startsWith(matchPrefix)
    : pathname === to || pathname.startsWith(to + '/')

  const link = (
    <NavLink
      to={to}
      className={cn(
        'relative z-10 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors',
        collapsed && 'justify-center',
        isActive
          ? 'text-primary'
          : 'text-text-secondary hover:bg-surface-border hover:text-text-primary'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )

  return (
    <div className="relative w-full">
      {isActive && (
        <motion.div
          layoutId="sidebar-torch"
          className="pointer-events-none absolute rounded-full"
          style={{ ...TORCH_POS, ...TORCH_STYLE }}
          transition={TORCH_TRANSITION}
        />
      )}
      {collapsed ? (
        <Tooltip.Root>
          <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              side="right"
              sideOffset={12}
              className="rounded-md border border-surface-border bg-surface px-2 py-1 text-xs text-text-primary shadow-lg"
            >
              {label}
              <Tooltip.Arrow className="fill-surface-border" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      ) : link}
    </div>
  )
}

// ─── Main sidebar ─────────────────────────────────────────────────────────────

export function Sidebar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { sidebarCollapsed, toggleSidebar, theme } = useUIStore()
  const collapsed = sidebarCollapsed
  const logoSrc = theme === 'dark' ? '/logo-dark.svg' : '/logo.svg'

  const { recent, trackVisit } = useRecentLabs()

  const { data: boards = [] } = useBoards()
  const activeBoards = boards.filter((b) => !b.isArchived)

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
          'relative flex h-screen flex-col overflow-hidden border-e border-surface-border bg-surface-muted transition-all duration-200',
          collapsed ? 'w-14' : 'w-56'
        )}
      >
        {/* Brand + toggle */}
        <div
          className={cn(
            'relative z-10 flex h-14 shrink-0 items-center border-b border-surface-border px-3',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img src={logoSrc} alt="Bento" className="h-6 w-6 rounded" />
              <span className="text-sm font-bold tracking-tight text-text-primary">bentolab</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-border hover:text-text-primary"
            aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Org switcher */}
        <div className="border-b border-surface-border px-2 py-2">
          <OrgDisplay collapsed={collapsed} />
        </div>

        {/* Recent boards */}
        <RecentSection boards={activeBoards} recent={recent} collapsed={collapsed} />

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {!collapsed && (
            <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-widest text-text-muted">
              {t('nav.workspace')}
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            <BoardsNavItem boards={activeBoards} collapsed={collapsed} />
            <GlobalNavItem to="/summary"  icon={LayoutDashboard} label={t('nav.summary')}  collapsed={collapsed} />
            <GlobalNavItem to="/timeline" icon={GanttChart}      label={t('nav.timeline')} collapsed={collapsed} />
            <GlobalNavItem to="/reports"  icon={BarChart2}       label={t('nav.reports')}  collapsed={collapsed} />
          </div>
        </div>

        {/* Personal */}
        <div className={cn('border-t border-surface-border px-2 py-2', collapsed && 'flex flex-col items-center gap-0.5')}>
          {!collapsed && (
            <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-widest text-text-muted">
              {t('nav.personal')}
            </p>
          )}
          <GlobalNavItem to="/my-issues"   icon={CircleDot}    label={t('nav.myIssues')} collapsed={collapsed} />
          <GlobalNavItem to="/inbox"       icon={Inbox}        label={t('nav.inbox')}    collapsed={collapsed} />
          <GlobalNavItem to="/calendar"    icon={CalendarDays} label={t('nav.calendar')} collapsed={collapsed} />
        </div>

        {/* Bottom: settings + user */}
        <div className="border-t border-surface-border px-2 pb-3 pt-2">
          <GlobalNavItem to="/settings/org" matchPrefix="/settings" icon={Settings} label={t('nav.settings')} collapsed={collapsed} />
          <div className="mt-1">
            <UserPanel collapsed={collapsed} />
          </div>
        </div>
      </aside>
    </Tooltip.Provider>
  )
}
