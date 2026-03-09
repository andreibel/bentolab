import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const TITLE_MAP: Record<string, string> = {
  '/boards':           'Boards',
  '/calendar':         'Calendar',
  '/my-issues':        'My Issues',
  '/inbox':            'Inbox',
  '/roadmap':          'Roadmap',
  '/sprints':          'Sprints',
  '/workload':         'Workload',
  '/reports':          'Reports',
  '/time-tracking':    'Time Tracking',
  '/settings/members': 'Members',
  '/settings/labels':  'Labels',
  '/automations':      'Automations',
  '/settings/org':     'Org Settings',
  '/settings/profile': 'Profile',
}

export function AppLayout() {
  const { pathname } = useLocation()
  const pageTitle = TITLE_MAP[pathname]

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={pageTitle} />
        <main className="flex-1 overflow-y-auto bg-surface-muted p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
