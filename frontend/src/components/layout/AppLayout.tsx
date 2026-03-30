import {useEffect, useState} from 'react'
import {Navigate, Outlet, useLocation, useMatch} from 'react-router-dom'
import {Sidebar} from './Sidebar'
import {Header} from './Header'
import {LabTopNav} from './LabTopNav'
import {CommandPalette} from './CommandPalette'
import {CreateIssueModal} from '@/components/issues/CreateIssueModal'
import {useAuthStore} from '@/stores/authStore'

const TITLE_MAP: Record<string, string> = {
  '/boards':             'Labs',
  '/calendar':           'Calendar',
  '/my-issues':          'My Issues',
  '/inbox':              'Inbox',
  '/settings/org':       'General',
  '/settings/members':   'Members',
  '/settings/labels':    'Labels',
  '/settings/security':  'Security & Permissions',
  '/settings/automations': 'Automations',
  '/settings/profile':   'Profile',
}

export function AppLayout() {
  const { pathname } = useLocation()
  const { currentOrgId } = useAuthStore()
  const [createOpen,  setCreateOpen]  = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)

  // If the user is authenticated but has no org context, send them to org creation.
  // This happens when a user registers but hasn't created an org yet, or when
  // the JWT was issued without an orgId (e.g., org-service was temporarily unavailable).
  if (!currentOrgId) {
    return <Navigate to="/org/new" replace />
  }

  // Global shortcut: `/` or ⌘K opens the command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if ((e.key === '/' && !inInput) || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault()
        setCommandOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Detect any /boards/:boardId route (including sub-routes like /backlog, /cycles…)
  const labMatch = useMatch({ path: '/boards/:boardId', end: false })
  const isLabRoute = !!labMatch

  // Full-screen pages that need no padding and no outer scroll (like board routes)
  const FULL_ROUTES = ['/calendar', '/my-issues']
  const isFullRoute = isLabRoute || FULL_ROUTES.includes(pathname)

  const pageTitle = isLabRoute ? undefined : TITLE_MAP[pathname]

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={pageTitle}
          onCreateClick={() => setCreateOpen(true)}
          onSearchClick={() => setCommandOpen(true)}
        />

        {isLabRoute && <LabTopNav />}

        {isFullRoute ? (
          <main className="flex flex-1 flex-col overflow-hidden bg-surface-muted">
            <Outlet />
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto bg-surface-muted p-6">
            <Outlet />
          </main>
        )}
      </div>

      <CreateIssueModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onCreateIssue={() => setCreateOpen(true)}
      />
    </div>
  )
}
