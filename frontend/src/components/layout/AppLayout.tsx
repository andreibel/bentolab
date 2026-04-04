import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useMatch } from 'react-router-dom'
import { CircleDot, Kanban } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { LabTopNav } from './LabTopNav'
import { CommandPalette } from './CommandPalette'
import { CreateIssueModal } from '@/components/issues/CreateIssueModal'
import { CreateBoardWizard } from '@/components/board/CreateBoardWizard'
import { useAuthStore } from '@/stores/authStore'

const TITLE_MAP: Record<string, string> = {
  '/boards':             'Labs',
  '/summary':            'Summary',
  '/timeline':           'Timeline',
  '/reports':            'Reports',
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
  const [createIssueOpen, setCreateIssueOpen] = useState(false)
  const [createBoardOpen, setCreateBoardOpen] = useState(false)
  const [commandOpen,     setCommandOpen]     = useState(false)

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

  const labMatch = useMatch({ path: '/boards/:boardId', end: false })
  const isLabRoute  = !!labMatch
  const isBoardList = pathname === '/boards'

  const FULL_ROUTES = ['/calendar', '/my-issues']
  const isFullRoute = isLabRoute || FULL_ROUTES.includes(pathname)

  const pageTitle = isLabRoute ? undefined : TITLE_MAP[pathname]

  // Context action: depends on which page the user is on
  const contextCreate = isBoardList
    ? { label: 'New Board', icon: Kanban,    onClick: () => setCreateBoardOpen(true) }
    : { label: 'New Issue', icon: CircleDot, onClick: () => setCreateIssueOpen(true) }

  const allCreates = [
    { label: 'New Issue', icon: CircleDot, onClick: () => setCreateIssueOpen(true) },
    { label: 'New Board', icon: Kanban,    onClick: () => setCreateBoardOpen(true) },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={pageTitle}
          contextCreate={contextCreate}
          allCreates={allCreates}
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

      <CreateIssueModal open={createIssueOpen} onClose={() => setCreateIssueOpen(false)} />
      <CreateBoardWizard open={createBoardOpen} onClose={() => setCreateBoardOpen(false)} />
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onCreateIssue={() => setCreateIssueOpen(true)}
      />
    </div>
  )
}
