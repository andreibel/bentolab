import {useState} from 'react'
import {Outlet, useLocation, useMatch} from 'react-router-dom'
import {Sidebar} from './Sidebar'
import {Header} from './Header'
import {LabTopNav} from './LabTopNav'
import {CreateIssueModal} from '@/components/issues/CreateIssueModal'

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
  const [createOpen, setCreateOpen] = useState(false)

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
        <Header title={pageTitle} onCreateClick={() => setCreateOpen(true)} />

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
    </div>
  )
}
