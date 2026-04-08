import {NavLink, useParams} from 'react-router-dom'
import {useBoard} from '@/api/boards'
import {cn} from '@/utils/cn'
import {Loader2} from 'lucide-react'
import {useTranslation} from 'react-i18next'
import type {BoardType} from '@/types/board'

interface LabTab {
  id:   string
  path: string
}

const ALL_TABS: LabTab[] = [
  { id: 'board',    path: ''          },
  { id: 'summary',  path: '/summary'  },
  { id: 'backlog',  path: '/backlog'  },
  { id: 'sprints',  path: '/sprints'  },
  { id: 'triage',   path: '/triage'   },
  { id: 'timeline', path: '/timeline' },
  { id: 'reports',  path: '/reports'  },
]

function getTabsForBoardType(boardType: BoardType | undefined): LabTab[] {
  switch (boardType) {
    case 'KANBAN':
      return ALL_TABS.filter((t) => !['sprints', 'triage'].includes(t.id))
    case 'BUG_TRACKING':
      return ALL_TABS.filter((t) => !['backlog', 'sprints'].includes(t.id))
    case 'SCRUM':
      return ALL_TABS.filter((t) => t.id !== 'triage')
    case 'CUSTOM':
    default:
      return ALL_TABS.filter((t) => t.id !== 'triage')
  }
}

export function LabTopNav() {
  const { boardId } = useParams<{ boardId: string }>()
  const { data: board, isLoading } = useBoard(boardId!)
  const { t } = useTranslation()

  if (!boardId) return null

  const tabs = getTabsForBoardType(board?.boardType)

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
        {tabs.map(({ id, path }) => {
          const to = `/boards/${boardId}${path}`
          return (
            <NavLink
              key={id}
              to={to}
              end={path === ''}
              className={({ isActive }) =>
                cn(
                  'relative h-10 px-3 text-sm font-medium transition-colors',
                  'flex items-center',
                  'after:absolute after:bottom-0 after:inset-s-0 after:inset-e-0 after:h-0.5 after:rounded-t-full after:transition-all',
                  isActive
                    ? 'text-primary after:bg-primary'
                    : 'text-text-muted hover:text-text-primary after:bg-transparent'
                )
              }
            >
              {t(`labTopNav.${id}`)}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
