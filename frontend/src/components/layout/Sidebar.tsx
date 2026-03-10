import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { orgsApi } from '@/api/orgs'
import { authApi } from '@/api/auth'
import { queryKeys } from '@/api/queryKeys'
import type { OrgListItem } from '@/types/org'
import { toast } from 'sonner'
import {
  Kanban,
  CircleDot,
  Users,
  Settings,
  ChevronDown,
  Building2,
  Plus,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  CalendarDays,
  Inbox,
  GanttChart,
  Timer,
  Users2,
  BarChart2,
  Clock,
  Tags,
  Zap,
  ShieldCheck,
  ArrowLeft,
  User,
  SlidersHorizontal,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  icon: React.ElementType
  to: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

// ─── Main nav config ──────────────────────────────────────────────────────────

const navGroups: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Boards',        icon: Kanban,       to: '/boards'       },
      { label: 'Calendar',      icon: CalendarDays, to: '/calendar'     },
      { label: 'My Issues',     icon: CircleDot,    to: '/my-issues'    },
      { label: 'Inbox',         icon: Inbox,        to: '/inbox'        },
    ],
  },
  {
    label: 'Planning',
    items: [
      { label: 'Roadmap',       icon: GanttChart,   to: '/roadmap'      },
      { label: 'Sprints',       icon: Timer,        to: '/sprints'      },
      { label: 'Workload',      icon: Users2,       to: '/workload'     },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Reports',       icon: BarChart2,    to: '/reports'      },
      { label: 'Time Tracking', icon: Clock,        to: '/time-tracking'},
    ],
  },
]

// ─── Settings nav config ──────────────────────────────────────────────────────

const settingsGroups: NavGroup[] = [
  {
    label: 'Organization',
    items: [
      { label: 'General',       icon: SlidersHorizontal, to: '/settings/org'         },
      { label: 'Members',       icon: Users,             to: '/settings/members'     },
      { label: 'Labels',        icon: Tags,              to: '/settings/labels'      },
      { label: 'Security',      icon: ShieldCheck,       to: '/settings/security'    },
      { label: 'Automations',   icon: Zap,               to: '/settings/automations' },
    ],
  },
  {
    label: 'Personal',
    items: [
      { label: 'Profile',       icon: User,              to: '/settings/profile'     },
    ],
  },
]

const SETTINGS_ROUTES = ['/settings/', '/settings']

function isSettingsPath(pathname: string) {
  return pathname.startsWith('/settings')
}

// ─── OrgSwitcher ─────────────────────────────────────────────────────────────

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
            'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-start transition-colors hover:bg-surface-border',
            collapsed && 'justify-center px-2'
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{displayName}</p>
                <p className="text-xs text-text-muted">{orgRole ?? '—'}</p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
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
              Your organizations
            </p>
          </div>

          {isLoading && (
            <div className="px-2 py-2 text-xs text-text-muted">Loading…</div>
          )}

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
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white',
                  isCurrent ? 'bg-primary' : 'bg-text-muted'
                )}>
                  {org.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{org.name}</p>
                  <p className="text-[10px] text-text-muted">{org.slug}</p>
                </div>
                {isCurrent && (
                  <span className="text-[10px] font-semibold text-primary">Active</span>
                )}
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

// ─── NavItem ─────────────────────────────────────────────────────────────────

function SidebarNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const content = (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors',
          collapsed && 'justify-center px-2',
          isActive
            ? 'bg-primary-subtle text-primary'
            : 'text-text-secondary hover:bg-surface-border hover:text-text-primary'
        )
      }
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
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
            {item.label}
            <Tooltip.Arrow className="fill-text-primary" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    )
  }

  return content
}

// ─── UserPanel ────────────────────────────────────────────────────────────────

function UserPanel({ collapsed }: { collapsed: boolean }) {
  const { user, orgRole, currentOrgId, orgSlug, logout } = useAuthStore()
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
    <div className="border-t border-surface-border pt-3">
      {!collapsed && (
        <div className="mb-2 rounded-lg bg-surface px-2.5 py-2 font-mono">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-1">
            Debug
          </p>
          <p className="text-[10px] text-text-muted truncate">
            <span className="text-text-secondary">org:</span> {orgSlug ?? '—'}
          </p>
          <p className="text-[10px] text-text-muted truncate">
            <span className="text-text-secondary">role:</span> {orgRole ?? '—'}
          </p>
          <p className="text-[10px] text-text-muted truncate">
            <span className="text-text-secondary">id:</span> {currentOrgId?.slice(0, 8)}…
          </p>
          <p className="text-[10px] text-text-muted truncate">
            <span className="text-text-secondary">user:</span> {user?.email ?? '—'}
          </p>
        </div>
      )}

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-surface-border',
              collapsed && 'justify-center'
            )}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 text-start">
                <p className="truncate text-sm font-medium text-text-primary">
                  {user ? `${user.firstName} ${user.lastName}` : '—'}
                </p>
                <p className="truncate text-xs text-text-muted">{user?.email}</p>
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
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-500 outline-none hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

// ─── Settings sidebar ─────────────────────────────────────────────────────────

function SettingsSidebar() {
  const navigate = useNavigate()

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-e border-surface-border bg-surface-muted">
      {/* Back to app */}
      <div className="flex h-14 shrink-0 items-center border-b border-surface-border px-3">
        <button
          onClick={() => navigate('/boards')}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-border hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          <img src="/logo.svg" alt="Bento" className="h-5 w-5" />
          <span className="font-bold tracking-[-0.5px] text-text-primary">bento</span>
        </button>
      </div>

      {/* Settings label */}
      <div className="px-4 pb-1 pt-4">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-text-muted" />
          <span className="text-sm font-semibold text-text-primary">Settings</span>
        </div>
      </div>

      {/* Nav tree */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
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

// ─── Main sidebar ─────────────────────────────────────────────────────────────

export function Sidebar() {
  const { pathname } = useLocation()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const collapsed = sidebarCollapsed
  const navigate = useNavigate()

  // Switch to settings sidebar when on any settings route
  if (isSettingsPath(pathname)) {
    return <SettingsSidebar />
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <aside
        className={cn(
          'flex h-screen flex-col border-e border-surface-border bg-surface-muted transition-all duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Top: logo + toggle */}
        <div
          className={cn(
            'flex h-14 shrink-0 items-center border-b border-surface-border px-3',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Bento" className="h-6 w-6" />
              <span className="text-sm font-bold tracking-[-0.5px] text-text-primary">bento</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-border hover:text-text-primary"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Org switcher */}
        <div className="px-2 py-3 border-b border-surface-border">
          <OrgSwitcher collapsed={collapsed} />
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              {!collapsed && (
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <SidebarNavItem key={item.to} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Settings entry at the bottom */}
        <div className="px-2 pb-2 border-t border-surface-border pt-2">
          <SidebarNavItem
            item={{ label: 'Settings', icon: Settings, to: '/settings/org' }}
            collapsed={collapsed}
          />
        </div>

        {/* User panel */}
        <div className="px-2 pb-3">
          <UserPanel collapsed={collapsed} />
        </div>
      </aside>
    </Tooltip.Provider>
  )
}
