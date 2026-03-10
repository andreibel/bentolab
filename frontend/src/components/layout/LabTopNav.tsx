import { NavLink, useParams } from 'react-router-dom'
import { useBoard } from '@/api/boards'
import { cn } from '@/utils/cn'
import { Loader2 } from 'lucide-react'

const LAB_TABS = [
  { label: 'Board',    path: ''          },
  { label: 'Summary',  path: '/summary'  },
  { label: 'Backlog',  path: '/backlog'  },
  { label: 'Sprints',  path: '/sprints'  },
  { label: 'Timeline', path: '/timeline' },
  { label: 'Reports',  path: '/reports'  },
]

export function LabTopNav() {
  const { boardId } = useParams<{ boardId: string }>()
  const { data: board, isLoading } = useBoard(boardId!)

  if (!boardId) return null

  return (
    <div className="flex h-10 shrink-0 items-center border-b border-surface-border bg-surface px-4">
      {/* Lab name */}
      <div className="flex items-center gap-2 pe-4">
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />
        ) : (
          <span className="text-sm font-semibold text-text-primary">{board?.name}</span>
        )}
        {board?.boardKey && (
          <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
            {board.boardKey}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="me-1 h-4 w-px bg-surface-border" />

      {/* Tabs */}
      <nav className="flex items-center">
        {LAB_TABS.map(({ label, path }) => {
          const to = `/boards/${boardId}${path}`
          return (
            <NavLink
              key={label}
              to={to}
              end={path === ''}
              className={({ isActive }) =>
                cn(
                  'relative h-10 px-3 text-sm font-medium transition-colors',
                  'flex items-center',
                  'after:absolute after:bottom-0 after:start-0 after:end-0 after:h-0.5 after:rounded-t-full after:transition-all',
                  isActive
                    ? 'text-primary after:bg-primary'
                    : 'text-text-muted hover:text-text-primary after:bg-transparent'
                )
              }
            >
              {label}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
