import { useState } from 'react'
import { Outlet, useLocation, useMatch } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { CreateIssueModal } from '@/components/issues/CreateIssueModal'

const TITLE_MAP: Record<string, string> = {
  '/boards':                   'Boards',
  '/calendar':                 'Calendar',
  '/my-issues':                'My Issues',
  '/inbox':                    'Inbox',
  '/roadmap':                  'Roadmap',
  '/sprints':                  'Sprints',
  '/workload':                 'Workload',
  '/reports':                  'Reports',
  '/time-tracking':            'Time Tracking',
  '/settings/org':             'General',
  '/settings/members':         'Members',
  '/settings/labels':          'Labels',
  '/settings/security':        'Security & Permissions',
  '/settings/automations':     'Automations',
  '/settings/profile':         'Profile',
}

export function AppLayout() {
  const { pathname } = useLocation()
  const isBoardDetail = useMatch('/boards/:boardId')
  const pageTitle = TITLE_MAP[pathname]

  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={pageTitle} onCreateClick={() => setCreateOpen(true)} />
        {isBoardDetail ? (
          <main className="flex flex-1 flex-col overflow-hidden bg-surface-muted">
            <Outlet />
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto bg-surface-muted p-6">
            <Outlet />
          </main>
        )}
      </div>

      {/* Global issue creation — no board pre-selected */}
      <CreateIssueModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
