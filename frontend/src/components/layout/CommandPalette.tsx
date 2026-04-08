import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import {useNavigate} from 'react-router-dom'
import Fuse from 'fuse.js'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {toast} from 'sonner'
import {useTranslation} from 'react-i18next'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Bug,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  CircleDot,
  CirclePlus,
  Compass,
  Inbox,
  Layers,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Minus,
  Plus,
  Search,
  Sparkles,
  Tag,
  User,
  UserCheck,
  UserCircle,
  X,
  Zap,
} from 'lucide-react'
import {boardsApi, useBoards} from '@/api/boards'
import {issuesApi} from '@/api/issues'
import {labelsApi} from '@/api/labels'
import {orgsApi} from '@/api/orgs'
import {usersApi} from '@/api/users'
import {queryKeys} from '@/api/queryKeys'
import {useAuthStore} from '@/stores/authStore'
import {cn} from '@/utils/cn'
import type {Board} from '@/types/board'
import type {IssueSearchResult} from '@/types/issue'

// ── Types ─────────────────────────────────────────────────────────────────────

type CategoryId = 'all' | 'issues' | 'boards' | 'new' | 'navigate'

type CommandItem = {
  id:           string
  group:        string
  icon?:        React.ElementType
  iconNode?:    React.ReactNode
  label:        string
  description?: string
  shortcut?:    string[]
  isCreatePreview?: boolean
  action:       () => void
}

// ── Slash command types ───────────────────────────────────────────────────────

type SlashCommandId =
  | 'assigned-to'
  | 'created-by'
  | 'start-after'
  | 'start-before'
  | 'due-after'
  | 'due-before'
  | 'priority'
  | 'type'
  | 'status'
  | 'label'
  | 'board'

type SlashCommandDef = {
  id:          SlashCommandId
  label:       string
  description: string
  icon:        React.ElementType
  valueType:   'user' | 'date' | 'priority' | 'type' | 'status' | 'label' | 'board'
}

type FilterToken = {
  uid:          string
  command:      SlashCommandId
  value:        string        // internal: userId or ISO date YYYY-MM-DD
  displayValue: string        // shown in pill
}

type SlashState =
  | { type: 'none' }
  | { type: 'command'; partial: string; replaceFrom: number }
  | { type: 'value';   command: SlashCommandDef; partial: string; replaceFrom: number }

type Suggestion =
  | { type: 'command'; id: string; label: string; description: string; icon: React.ElementType; def: SlashCommandDef }
  | { type: 'value';   id: string; label: string; description?: string; icon: React.ElementType; value: string; displayValue: string }

// ── Slash command definitions ─────────────────────────────────────────────────

const SLASH_COMMANDS: SlashCommandDef[] = [
  { id: 'priority',     label: 'Priority',     description: 'Filter by priority level',  icon: ArrowUp,      valueType: 'priority' },
  { id: 'type',         label: 'Type',         description: 'Filter by issue type',       icon: CircleDot,    valueType: 'type'     },
  { id: 'status',       label: 'Status',       description: 'Filter open or closed',      icon: CheckSquare,  valueType: 'status'   },
  { id: 'label',        label: 'Label',        description: 'Filter by label tag',         icon: Tag,          valueType: 'label'    },
  { id: 'board',        label: 'Board',        description: 'Filter by board',             icon: LayoutGrid,   valueType: 'board'    },
  { id: 'assigned-to',  label: 'Assigned to',  description: 'Filter by assignee',          icon: UserCheck,    valueType: 'user'     },
  { id: 'created-by',   label: 'Created by',   description: 'Filter by issue creator',     icon: UserCircle,   valueType: 'user'     },
  { id: 'start-after',  label: 'Start after',  description: 'Started after a date',        icon: CalendarDays, valueType: 'date'     },
  { id: 'start-before', label: 'Start before', description: 'Started before a date',       icon: CalendarDays, valueType: 'date'     },
  { id: 'due-after',    label: 'Due after',    description: 'Due date is after',            icon: CalendarDays, valueType: 'date'     },
  { id: 'due-before',   label: 'Due before',   description: 'Due date is before',           icon: CalendarDays, valueType: 'date'     },
]

const PRIORITY_OPTIONS = [
  { value: 'CRITICAL', label: 'Critical', icon: ArrowUp,   color: 'text-red-500'    },
  { value: 'HIGH',     label: 'High',     icon: ArrowUp,   color: 'text-orange-500' },
  { value: 'MEDIUM',   label: 'Medium',   icon: Minus,     color: 'text-yellow-500' },
  { value: 'LOW',      label: 'Low',      icon: ArrowDown, color: 'text-blue-400'   },
]

const TYPE_OPTIONS = [
  { value: 'STORY',   label: 'Story',    icon: BookOpen,    color: 'text-emerald-500' },
  { value: 'TASK',    label: 'Task',     icon: CheckSquare, color: 'text-blue-500'    },
  { value: 'BUG',     label: 'Bug',      icon: Bug,         color: 'text-red-500'     },
  { value: 'SUBTASK', label: 'Sub-task', icon: Zap,         color: 'text-yellow-500'  },
]

const STATUS_OPTIONS = [
  { value: 'open',   label: 'Open',   color: 'text-green-500' },
  { value: 'closed', label: 'Closed', color: 'text-text-muted' },
]

// ── Date suggestions ──────────────────────────────────────────────────────────

type DateSuggestion = { id: string; label: string; iso: string }

function getDateSuggestions(): DateSuggestion[] {
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const today = new Date()

  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1)

  const day = today.getDay()
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - (day === 0 ? 6 : day - 1))

  const nextWeekStart = new Date(thisWeekStart); nextWeekStart.setDate(thisWeekStart.getDate() + 7)
  const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(thisWeekStart.getDate() - 7)
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  return [
    { id: 'today',      label: 'Today',      iso: fmt(today)         },
    { id: 'tomorrow',   label: 'Tomorrow',   iso: fmt(tomorrow)      },
    { id: 'yesterday',  label: 'Yesterday',  iso: fmt(yesterday)     },
    { id: 'this-week',  label: 'This week',  iso: fmt(thisWeekStart) },
    { id: 'next-week',  label: 'Next week',  iso: fmt(nextWeekStart) },
    { id: 'last-week',  label: 'Last week',  iso: fmt(lastWeekStart) },
    { id: 'this-month', label: 'This month', iso: fmt(thisMonthStart)},
  ]
}

// ── Slash state parser ────────────────────────────────────────────────────────

function parseSlashState(query: string): SlashState {
  // Match: (start | whitespace) / (word chars and hyphens, may be empty) (optionally: space + more word chars)$
  const m = query.match(/(^|\s)\/([\w-]*)(\s+([\w-]*))?$/)
  if (!m) return { type: 'none' }

  const startOffset = m[1].length  // 0 if start of string, 1 if space
  const replaceFrom = m.index! + startOffset
  const cmdPartial  = m[2]
  const hasSpace    = !!m[3]
  const valPartial  = m[4] ?? ''

  if (hasSpace) {
    const cmd = SLASH_COMMANDS.find(c => c.id === cmdPartial)
    if (cmd) return { type: 'value', command: cmd, partial: valPartial, replaceFrom }
    // Unknown command + space — fall through as generic command partial
  }

  return { type: 'command', partial: cmdPartial, replaceFrom }
}

// ── Token filter ──────────────────────────────────────────────────────────────

function applyTokenFilters(results: IssueSearchResult[], tokens: FilterToken[]): IssueSearchResult[] {
  if (tokens.length === 0) return results
  return results.filter(r => tokens.every(t => {
    switch (t.command) {
      case 'assigned-to':  return r.assigneeId === t.value
      case 'created-by':   return r.reporterId === t.value
      case 'start-after':  return r.startDate != null && r.startDate > t.value
      case 'start-before': return r.startDate != null && r.startDate < t.value
      case 'due-after':    return r.dueDate != null && r.dueDate > t.value
      case 'due-before':   return r.dueDate != null && r.dueDate < t.value
      case 'priority':     return r.priority === t.value
      case 'type':         return r.type === t.value
      case 'status':       return t.value === 'closed' ? r.closed : !r.closed
      case 'label':        return r.labelIds?.includes(t.value) ?? false
      case 'board':        return r.boardId === t.value
      default:             return true
    }
  }))
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: { id: CategoryId; icon: React.ElementType }[] = [
  { id: 'all',      icon: Search     },
  { id: 'issues',   icon: CircleDot  },
  { id: 'boards',   icon: LayoutGrid },
  { id: 'new',      icon: Plus       },
  { id: 'navigate', icon: Compass    },
]

const DEFAULT_BG = '#5B47E0'

const BOARD_TYPES: { value: Board['boardType']; label: string }[] = [
  { value: 'KANBAN',       label: 'Kanban'       },
  { value: 'SCRUM',        label: 'Scrum'        },
  { value: 'BUG_TRACKING', label: 'Bug Tracking' },
  { value: 'CUSTOM',       label: 'Custom'       },
]

function autoKey(name: string): string {
  const initials = name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').join('')
  return (initials || name.toUpperCase()).slice(0, 4)
}

const TEMPLATE_ALIASES: Record<string, Board['boardType']> = {
  kanban:           'KANBAN',
  scrum:            'SCRUM',
  bug:              'BUG_TRACKING',
  bugs:             'BUG_TRACKING',
  'bug-tracking':   'BUG_TRACKING',
  custom:           'CUSTOM',
}

type ParsedNewBoard = {
  key:              string
  name:             string
  ready:            boolean
  detectedTemplate: Board['boardType'] | null
}

function parseNewBoard(query: string): ParsedNewBoard | null {
  const m = query.match(/^new\s+board(?:\s+(\S+)(?:\s+(.+))?)?$/i)
  if (!m) return null

  const rawKey  = (m[1] ?? '').toUpperCase().slice(0, 4)
  let   rawName = m[2]?.trim() ?? ''

  let detectedTemplate: Board['boardType'] | null = null
  const words    = rawName.split(/\s+/)
  const lastWord = words[words.length - 1]?.toLowerCase() ?? ''
  if (TEMPLATE_ALIASES[lastWord]) {
    detectedTemplate = TEMPLATE_ALIASES[lastWord]
    rawName = words.slice(0, -1).join(' ').trim()
  }

  const name = rawName || rawKey
  const key  = rawName ? rawKey : autoKey(rawKey)

  return {
    key:              key  || '…',
    name:             name || '…',
    ready:            key.length >= 1 && name.length >= 1,
    detectedTemplate,
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex min-h-4.5 min-w-4.5 items-center justify-center rounded border border-surface-border bg-surface px-1.5 font-mono text-[10px] font-medium text-text-secondary"
      style={{ boxShadow: '0 2px 0 0 var(--color-surface-border)' }}
    >
      {children}
    </kbd>
  )
}

function BoardDot({ bg }: { bg: string }) {
  return <span className="h-3.5 w-3.5 rounded" style={{ backgroundColor: bg }} />
}

function TokenPill({
  token,
  onRemove,
}: {
  token: FilterToken
  onRemove: () => void
}) {
  const def = SLASH_COMMANDS.find(c => c.id === token.command)
  const Icon = def?.icon ?? User
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/50 bg-primary/8 px-2 py-0.5 text-xs font-medium text-primary">
      <Icon className="h-3 w-3 shrink-0" />
      <span className="opacity-70">{def?.label ?? token.command}:</span>
      <span>{token.displayValue}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ms-0.5 rounded-full p-0.5 opacity-60 transition-all hover:bg-primary/20 hover:opacity-100"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  )
}

// ── Create-board preview row ──────────────────────────────────────────────────

function CreateBoardRow({
  active, parsed, template, onTemplate, isPending,
}: {
  active:     boolean
  parsed:     { key: string; name: string; ready: boolean }
  template:   Board['boardType']
  onTemplate: (t: Board['boardType']) => void
  isPending:  boolean
}) {
  const { t } = useTranslation()
  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3 transition-colors',
      active ? 'bg-primary/8' : 'bg-surface-muted/40',
    )}>
      <span className={cn(
        'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
        active ? 'bg-primary/10' : 'bg-surface-muted',
      )}>
        <Sparkles className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-text-muted')} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-text-primary">
          {parsed.ready ? (
            <>
              Create <span className="text-primary">"{parsed.name}"</span>
              <span className="ms-2 font-mono text-xs text-text-muted"
                style={{ boxShadow: '0 1px 0 0 var(--color-surface-border)' }}>
                <kbd className="rounded border border-surface-border bg-surface px-1.5 py-0.5 font-mono text-[10px]">
                  {parsed.key}
                </kbd>
              </span>
            </>
          ) : (
            <span className="text-text-muted">
              Type: <kbd className="rounded border border-surface-border bg-surface px-1.5 py-0.5 font-mono text-[10px]"
                style={{ boxShadow: '0 2px 0 0 var(--color-surface-border)' }}>
                {t('commandPalette.createBoard.typeHint')}
              </kbd>
            </span>
          )}
        </span>

        {parsed.ready && (
          <span className="mt-1.5 flex flex-wrap items-center gap-1">
            <span className="me-0.5 text-[10px] text-text-muted">{t('commandPalette.createBoard.template')}</span>
            {BOARD_TYPES.map(bt => (
              <button
                key={bt.value}
                type="button"
                onClick={e => { e.stopPropagation(); onTemplate(bt.value) }}
                className={cn(
                  'rounded border px-2 py-0.5 text-[10px] font-medium transition-colors',
                  template === bt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-surface-border bg-surface text-text-muted hover:border-primary/40 hover:text-text-primary',
                )}
              >
                {bt.label}
              </button>
            ))}
          </span>
        )}
      </span>

      {active && parsed.ready && (
        <span className="mt-0.5 flex shrink-0 items-center gap-1 text-[11px] text-primary">
          {isPending ? <span className="text-text-muted">{t('commandPalette.createBoard.creating')}</span> : <><Kbd>↵</Kbd> {t('commandPalette.createBoard.create')}</>}
        </span>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CommandPalette({
  open,
  onClose,
  onCreateIssue,
}: {
  open:           boolean
  onClose:        () => void
  onCreateIssue?: () => void
}) {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const { t }        = useTranslation()
  const currentUser  = useAuthStore(s => s.user)
  const currentOrgId = useAuthStore(s => s.currentOrgId)

  const [query,          setQuery]          = useState('')
  const [tokens,         setTokens]         = useState<FilterToken[]>([])
  const [category,       setCategory]       = useState<CategoryId>('all')
  const [activeIdx,      setActiveIdx]       = useState(0)
  const [suggestionIdx,  setSuggestionIdx]   = useState(0)
  const [createTemplate, setCreateTemplate]  = useState<Board['boardType']>('KANBAN')

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef  = useRef<HTMLDivElement>(null)

  const { data: boards = [] } = useBoards()

  // ── Slash state (derived from query) ───────────────────────────────────────

  const slashState = useMemo(() => parseSlashState(query), [query])
  const isSuggesting = slashState.type !== 'none'

  // ── Org members + profiles (loaded lazily when a user command is in-flight) ─

  const needsUsers  = slashState.type === 'value' && slashState.command.valueType === 'user'
  const needsLabels = slashState.type === 'value' && slashState.command.valueType === 'label'

  const { data: orgLabels = [] } = useQuery({
    queryKey: queryKeys.labels.list(currentOrgId!),
    queryFn:  labelsApi.list,
    enabled:  !!currentOrgId && needsLabels,
    staleTime: 5 * 60_000,
  })

  const { data: orgMembers = [] } = useQuery({
    queryKey: ['org-members', currentOrgId],
    queryFn:  () => orgsApi.listMembers(currentOrgId!),
    enabled:  !!currentOrgId && needsUsers,
    staleTime: 5 * 60_000,
  })

  const memberIds = useMemo(() => orgMembers.map(m => m.userId), [orgMembers])

  const { data: memberProfiles = [] } = useQuery({
    queryKey: ['user-profiles', memberIds],
    queryFn:  () => usersApi.batchGet(memberIds),
    enabled:  memberIds.length > 0 && needsUsers,
    staleTime: 5 * 60_000,
  })

  const profileMap = useMemo(
    () => new Map(memberProfiles.map(p => [p.id, p])),
    [memberProfiles],
  )

  // ── Current suggestions list ───────────────────────────────────────────────

  const suggestions = useMemo<Suggestion[]>(() => {
    if (slashState.type === 'command') {
      const partial = slashState.partial.toLowerCase()
      return SLASH_COMMANDS
        .filter(c => c.id.includes(partial) || c.label.toLowerCase().includes(partial))
        .map(c => ({
          type:        'command' as const,
          id:          c.id,
          label:       c.label,
          description: c.description,
          icon:        c.icon,
          def:         c,
        }))
    }

    if (slashState.type === 'value') {
      const partial = slashState.partial.toLowerCase()
      const cmd     = slashState.command

      if (cmd.valueType === 'priority') {
        return PRIORITY_OPTIONS
          .filter(p => p.label.toLowerCase().includes(partial))
          .map(p => ({
            type:         'value' as const,
            id:           p.value,
            label:        p.label,
            icon:         p.icon,
            value:        p.value,
            displayValue: p.label,
          }))
      }

      if (cmd.valueType === 'type') {
        return TYPE_OPTIONS
          .filter(t => t.label.toLowerCase().includes(partial))
          .map(t => ({
            type:         'value' as const,
            id:           t.value,
            label:        t.label,
            icon:         t.icon,
            value:        t.value,
            displayValue: t.label,
          }))
      }

      if (cmd.valueType === 'status') {
        return STATUS_OPTIONS
          .filter(s => s.label.toLowerCase().includes(partial))
          .map(s => ({
            type:         'value' as const,
            id:           s.value,
            label:        s.label,
            icon:         CircleDot,
            value:        s.value,
            displayValue: s.label,
          }))
      }

      if (cmd.valueType === 'label') {
        return orgLabels
          .filter(l => l.name.toLowerCase().includes(partial))
          .map(l => ({
            type:         'value' as const,
            id:           l.id,
            label:        l.name,
            description:  l.description ?? undefined,
            icon:         Tag,
            value:        l.id,
            displayValue: l.name,
          }))
      }

      if (cmd.valueType === 'board') {
        return boards
          .filter(b => b.name.toLowerCase().includes(partial) || b.boardKey.toLowerCase().includes(partial))
          .map(b => ({
            type:         'value' as const,
            id:           b.id,
            label:        b.name,
            description:  b.boardKey,
            icon:         LayoutGrid,
            value:        b.id,
            displayValue: b.name,
          }))
      }

      if (cmd.valueType === 'date') {
        return getDateSuggestions()
          .filter(d => d.id.includes(partial) || d.label.toLowerCase().includes(partial))
          .map(d => ({
            type:         'value' as const,
            id:           d.id,
            label:        d.label,
            description:  d.iso,
            icon:         CalendarDays,
            value:        d.iso,
            displayValue: d.label,
          }))
      }

      if (cmd.valueType === 'user') {
        const results: Suggestion[] = []

        // "Me" option first
        const meName = currentUser
          ? [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || currentUser.email
          : 'Me'
        if ('me'.includes(partial) || meName.toLowerCase().includes(partial)) {
          results.push({
            type:         'value',
            id:           'me',
            label:        `Me (${meName})`,
            description:  'Yourself',
            icon:         User,
            value:        currentUser?.id ?? '',
            displayValue: 'me',
          })
        }

        // Org members
        for (const member of orgMembers) {
          if (member.userId === currentUser?.id) continue
          const profile = profileMap.get(member.userId)
          const name    = profile
            ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email
            : member.userId
          if (partial && !name.toLowerCase().includes(partial) && !profile?.email.toLowerCase().includes(partial)) continue
          results.push({
            type:         'value',
            id:           member.userId,
            label:        name,
            description:  profile?.email,
            icon:         User,
            value:        member.userId,
            displayValue: profile?.firstName ?? name.split(' ')[0] ?? name,
          })
        }
        return results
      }
    }

    return []
  }, [slashState, currentUser, orgMembers, orgLabels, boards, profileMap])

  // Reset suggestion index when suggestions change
  useEffect(() => { setSuggestionIdx(0) }, [suggestions.length])

  // ── Issue search (debounced, backend) ─────────────────────────────────────

  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchResults,  setSearchResults]  = useState<IssueSearchResult[]>([])
  const [searchLoading,  setSearchLoading]  = useState(false)

  // The free-text portion of the query (excludes the current in-progress slash segment)
  const freeTextQuery = useMemo(() => {
    if (slashState.type === 'none') return query.trim()
    return query.slice(0, slashState.replaceFrom).trimEnd()
  }, [query, slashState])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(freeTextQuery), 300)
    return () => clearTimeout(t)
  }, [freeTextQuery])

  const inIssueCategory = category === 'all' || category === 'issues'

  // Full-text search when user typed something
  useEffect(() => {
    const q = debouncedQuery
    if (q.length < 2 || !inIssueCategory) { setSearchResults([]); return }
    let cancelled = false
    setSearchLoading(true)
    issuesApi.search(q, 20)
      .then(data  => { if (!cancelled) setSearchResults(data)  })
      .catch(()   => { if (!cancelled) setSearchResults([])    })
      .finally(() => { if (!cancelled) setSearchLoading(false) })
    return () => { cancelled = true }
  }, [debouncedQuery, category])  // eslint-disable-line react-hooks/exhaustive-deps

  // Mine fallback — used when tokens are active but no free text typed
  const usesMine = tokens.length > 0 && debouncedQuery.length < 2 && inIssueCategory
  const { data: minePage, isLoading: mineLoading } = useQuery({
    queryKey: ['issues', 'mine-palette'],
    queryFn:  () => issuesApi.mine('all', false),
    enabled:  usesMine,
    staleTime: 60_000,
  })
  const mineResults = useMemo<IssueSearchResult[]>(() => {
    if (!minePage) return []
    return minePage.content.map(i => ({
      issueId:         i.id,
      issueKey:        i.issueKey,
      title:           i.title,
      boardId:         i.boardId,
      priority:        i.priority,
      type:            i.type,
      closed:          i.closed,
      assigneeId:      i.assigneeId,
      reporterId:      i.reporterId,
      epicId:          i.epicId ?? null,
      labelIds:        i.labelIds ?? [],
      startDate:       i.startDate,
      dueDate:         i.dueDate,
      matchIn:         'TITLE' as const,
      snippet:         '',
      commentAuthorId: null,
    }))
  }, [minePage])

  // Base dataset: text search results OR mine fallback for token-only queries
  const baseResults   = debouncedQuery.length >= 2 ? searchResults : mineResults
  const issueLoading  = debouncedQuery.length >= 2 ? searchLoading : mineLoading

  // Apply token filters client-side
  const filteredIssueResults = useMemo(
    () => applyTokenFilters(baseResults, tokens),
    [baseResults, tokens],
  )

  // ── Board creation mutation ───────────────────────────────────────────────

  const createBoard = useMutation({
    mutationFn: boardsApi.create,
    onSuccess: (board) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.all('') })
      toast.success(t('commandPalette.toasts.boardCreated', { name: board.name }))
      navigate(`/boards/${board.id}`)
      handleClose()
    },
    onError: (err: unknown, variables) => {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 409) {
        toast.error(t('commandPalette.toasts.boardKeyExists', { key: variables.boardKey }))
      } else {
        toast.error(t('commandPalette.toasts.boardCreateFailed'))
      }
    },
  })

  // ── Commit/remove tokens ──────────────────────────────────────────────────

  function applySuggestion(s: Suggestion) {
    const state = parseSlashState(query)
    if (state.type === 'none') return

    if (s.type === 'command') {
      const before = query.slice(0, state.replaceFrom)
      setQuery(`${before}/${s.def.id} `)
    } else {
      const before  = query.slice(0, state.replaceFrom).trimEnd()
      const command = state.type === 'value' ? state.command.id : ('' as SlashCommandId)
      setTokens(prev => [...prev, {
        uid:          Math.random().toString(36).slice(2),
        command,
        value:        s.value,
        displayValue: s.displayValue,
      }])
      setQuery(before)
    }
    setSuggestionIdx(0)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function removeToken(uid: string) {
    setTokens(prev => prev.filter(t => t.uid !== uid))
  }

  // ── Reset on close ────────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    setQuery('')
    setTokens([])
    setCategory('all')
    setActiveIdx(0)
    setSuggestionIdx(0)
    setCreateTemplate('KANBAN')
    setSearchResults([])
    setDebouncedQuery('')
    onClose()
  }, [onClose])

  // ── Focus on open ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 20)
    return () => clearTimeout(t)
  }, [open])

  // ── Board commands ────────────────────────────────────────────────────────

  const boardFuse = useMemo(
    () => new Fuse(boards, { keys: ['name', 'boardKey'], threshold: 0.4 }),
    [boards],
  )

  const boardItems = useMemo<CommandItem[]>(
    () => boards.map(b => ({
      id:       `board-${b.id}`,
      group:    'Boards',
      iconNode: <BoardDot bg={b.background ?? '#6B7280'} />,
      label:       b.name,
      description: b.boardKey,
      action: () => { navigate(`/boards/${b.id}`); handleClose() },
    })),
    [boards, navigate, handleClose],
  )

  // ── Static commands ───────────────────────────────────────────────────────

  const staticCommands = useMemo<CommandItem[]>(() => [
    {
      id: 'new-board-hint', group: 'New',
      icon: Plus, label: 'Create Board…',
      description: 'Type:  new board KEY Name',
      action: () => { setCategory('new'); setQuery('new board '); setActiveIdx(0) },
    },
    {
      id: 'action-create-issue', group: 'New',
      icon: CirclePlus, label: 'Create Issue',
      description: 'Open the create issue dialog',
      shortcut: ['C'],
      action: () => { handleClose(); onCreateIssue?.() },
    },
    {
      id: 'nav-all-boards', group: 'Navigate',
      icon: LayoutGrid, label: 'All Boards',
      description: 'Browse all your boards',
      action: () => { navigate('/boards'); handleClose() },
    },
    {
      id: 'nav-my-issues', group: 'Navigate',
      icon: Layers, label: 'My Issues',
      action: () => { navigate('/my-issues'); handleClose() },
    },
    {
      id: 'nav-calendar', group: 'Navigate',
      icon: CalendarDays, label: 'Calendar',
      action: () => { navigate('/calendar'); handleClose() },
    },
    {
      id: 'nav-inbox', group: 'Navigate',
      icon: Inbox, label: 'Inbox',
      action: () => { navigate('/inbox'); handleClose() },
    },
    {
      id: 'nav-profile', group: 'Navigate',
      icon: UserCircle, label: 'Profile Settings',
      action: () => { navigate('/settings/profile'); handleClose() },
    },
  ], [navigate, handleClose, onCreateIssue])

  // ── Issue results as CommandItems ─────────────────────────────────────────

  const issueItems = useMemo<CommandItem[]>(
    () => filteredIssueResults.map(r => ({
      id:      `issue-${r.issueId}`,
      group:   'Issues',
      icon:    r.matchIn === 'COMMENT' ? MessageSquare : CircleDot,
      label:   `${r.issueKey}  ${r.title}`,
      description: r.snippet || undefined,
      action: () => {
        navigate(`/boards/${r.boardId}?issue=${r.issueId}`)
        handleClose()
      },
    })),
    [filteredIssueResults, navigate, handleClose],
  )

  // ── Inline "new board" detection ──────────────────────────────────────────

  const newBoardParsed   = useMemo(() => parseNewBoard(query), [query])
  const effectiveTemplate = newBoardParsed?.detectedTemplate ?? createTemplate

  // ── Combined results ──────────────────────────────────────────────────────

  const results = useMemo<CommandItem[]>(() => {
    const q = freeTextQuery

    const createPreview: CommandItem[] = newBoardParsed ? [{
      id:              'quick-create-board',
      group:           'Create',
      isCreatePreview: true,
      label:           `Create "${newBoardParsed.name}"`,
      action: () => {
        if (!newBoardParsed.ready || createBoard.isPending) return
        createBoard.mutate({
          name:       newBoardParsed.name,
          boardKey:   newBoardParsed.key,
          boardType:  effectiveTemplate,
          background: DEFAULT_BG,
        })
      },
    }] : []

    let filteredBoards: CommandItem[]
    if (newBoardParsed) {
      filteredBoards = []
    } else if (!q) {
      filteredBoards = boardItems
    } else {
      filteredBoards = boardFuse.search(q).map(r =>
        boardItems.find(item => item.id === `board-${r.item.id}`)!,
      ).filter(Boolean)
    }

    const filteredStatic = (() => {
      const words = q.toLowerCase().split(/\s+/).filter(Boolean)
      return staticCommands.filter(cmd => {
        if (category === 'issues')  return false
        if (category === 'new'      && cmd.group !== 'New')      return false
        if (category === 'navigate' && cmd.group !== 'Navigate') return false
        if (category === 'boards'   && cmd.id !== 'new-board-hint') return false
        if (!words.length) return true
        const hay = `${cmd.label} ${cmd.description ?? ''} ${cmd.group}`.toLowerCase()
        return words.every(w => hay.includes(w))
      })
    })()

    if (category === 'issues')   return [...issueItems]
    if (category === 'boards')   return [...createPreview, ...filteredBoards, ...filteredStatic]
    if (category === 'new')      return [...createPreview, ...filteredStatic]
    if (category === 'navigate') return [...filteredStatic]
    return [...createPreview, ...issueItems, ...filteredBoards, ...filteredStatic]
  }, [freeTextQuery, query, category, boardItems, boardFuse, staticCommands, issueItems, newBoardParsed, createBoard, effectiveTemplate])

  // ── Grouped ───────────────────────────────────────────────────────────────

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>()
    for (const cmd of results) {
      if (cmd.isCreatePreview) continue
      const arr = map.get(cmd.group) ?? []
      arr.push(cmd)
      map.set(cmd.group, arr)
    }
    return map
  }, [results])

  const createPreviewItem = results.find(r => r.isCreatePreview) ?? null
  const flat              = results

  const safeActiveIdx = flat.length === 0 ? 0 : Math.min(activeIdx, flat.length - 1)
  const safeSugIdx    = suggestions.length === 0 ? 0 : Math.min(suggestionIdx, suggestions.length - 1)

  // ── Scroll active item into view ──────────────────────────────────────────

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [safeActiveIdx])

  // ── Keyboard handler ──────────────────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent) {
    // ── When slash suggestions are visible ─────────────────────────────────
    if (isSuggesting && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSuggestionIdx(i => (i + 1) % suggestions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSuggestionIdx(i => (i - 1 + suggestions.length) % suggestions.length)
        return
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        applySuggestion(suggestions[safeSugIdx])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        // Remove the current slash segment from the query
        const state = parseSlashState(query)
        if (state.type !== 'none') {
          setQuery(query.slice(0, state.replaceFrom).trimEnd())
        }
        return
      }
      return  // Other keys fall through to native input behavior
    }

    // ── Template cycling when create-preview is active ────────────────────
    const atEnd = inputRef.current?.selectionStart === query.length
               && inputRef.current?.selectionEnd   === query.length
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && newBoardParsed && atEnd) {
      e.preventDefault()
      const types = BOARD_TYPES.map(t => t.value)
      const cur   = types.indexOf(effectiveTemplate)
      const next  = e.key === 'ArrowRight'
        ? (cur + 1) % types.length
        : (cur - 1 + types.length) % types.length
      setCreateTemplate(types[next])
      return
    }

    // ── Normal navigation ─────────────────────────────────────────────────
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => (i + 1) % Math.max(1, flat.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => (i - 1 + Math.max(1, flat.length)) % Math.max(1, flat.length))
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const idx  = CATEGORIES.findIndex(c => c.id === category)
      const next = CATEGORIES[(idx + (e.shiftKey ? -1 + CATEGORIES.length : 1)) % CATEGORIES.length]
      setCategory(next.id)
      setActiveIdx(0)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      flat[safeActiveIdx]?.action()
    } else if (e.key === 'Escape') {
      handleClose()
    }
  }

  // ── Input placeholder ─────────────────────────────────────────────────────

  const placeholder = useMemo(() => {
    if (slashState.type === 'value') {
      const cmd = slashState.command
      if (cmd.valueType === 'date') return t('commandPalette.placeholder.date')
      return t('commandPalette.placeholder.value')
    }
    if (slashState.type === 'command') return t('commandPalette.placeholder.command')
    if (category === 'issues')         return t('commandPalette.placeholder.issues')
    if (category === 'boards')         return t('commandPalette.placeholder.boards')
    if (category === 'new')            return t('commandPalette.placeholder.new')
    if (category === 'navigate')       return t('commandPalette.placeholder.navigate')
    return t('commandPalette.placeholder.default')
  }, [slashState, category, t])

  if (!open) return null

  // ── Render ────────────────────────────────────────────────────────────────

  return createPortal(
    <div
      className="fixed inset-0 z-200 flex items-start justify-center pt-[11vh]"
      onMouseDown={e => { if (e.target === e.currentTarget) handleClose() }}
    >
      {/* Backdrop */}
      <div className="animate-backdrop-in absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="animate-palette-in relative flex w-3/4 max-w-3xl flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl"
        style={{ maxHeight: '66vh' }}
      >
        {/* Search row — tokens + input */}
        <div className="flex min-h-[60px] flex-wrap items-center gap-2 border-b border-surface-border px-5 py-3">
          <Search className="h-5 w-5 shrink-0 text-text-muted" />

          {/* Applied filter tokens */}
          {tokens.map(t => (
            <TokenPill key={t.uid} token={t} onRemove={() => removeToken(t.uid)} />
          ))}

          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-w-[120px] flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted"
            autoComplete="off"
            spellCheck={false}
          />

          {(query || tokens.length > 0) && (
            <button
              onClick={() => { setQuery(''); setTokens([]); inputRef.current?.focus() }}
              className="rounded p-0.5 text-text-muted hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleClose}
            className="rounded-lg border border-surface-border px-2 py-1 text-[11px] text-text-muted hover:bg-surface-muted hover:text-text-primary"
          >
            Esc
          </button>
        </div>

        {/* Slash command suggestions — shown between input and body */}
        {isSuggesting && suggestions.length > 0 && (
          <div className="shrink-0 border-b border-primary/15 bg-primary/[0.03]">
            <div className="flex items-center gap-2 px-5 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/50">
                {slashState.type === 'command'
                  ? t('commandPalette.commandsHeader')
                  : t('commandPalette.chooseValue', { id: slashState.command.id })}
              </span>
              <span className="ms-auto text-[10px] text-text-muted opacity-40">
                <Kbd>↑</Kbd><Kbd>↓</Kbd> {t('commandPalette.hint.navigate')} · <Kbd>↵</Kbd> {t('commandPalette.hint.select')} · <Kbd>Esc</Kbd> {t('commandPalette.hint.dismiss')}
              </span>
            </div>

            {suggestions.map((s, i) => {
              const Icon   = s.icon
              const active = i === safeSugIdx
              return (
                <button
                  key={s.id}
                  onMouseEnter={() => setSuggestionIdx(i)}
                  onClick={() => applySuggestion(s)}
                  className={cn(
                    'flex w-full items-center gap-3 px-5 py-2 text-left transition-colors',
                    active
                      ? 'bg-primary/10 text-text-primary'
                      : 'text-text-secondary hover:bg-surface-muted',
                  )}
                >
                  <span className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs',
                    active ? 'bg-primary/15 text-primary' : 'bg-surface-muted text-text-muted',
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {s.type === 'command'
                        ? <><span className="font-mono text-primary">/</span>{s.def.id}</>
                        : s.label
                      }
                    </span>
                    {s.description && (
                      <span className="block text-xs text-text-muted">{s.description}</span>
                    )}
                  </span>

                  {active && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </button>
              )
            })}
          </div>
        )}

        {/* Body: sidebar + results */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* Left sidebar */}
          <nav className="flex w-32 shrink-0 flex-col gap-0.5 border-e border-surface-border p-2">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.id); setActiveIdx(0); inputRef.current?.focus() }}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                    category === cat.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {t(`commandPalette.categories.${cat.id}`)}
                </button>
              )
            })}

            {/* Active filter token count */}
            {tokens.length > 0 && (
              <div className="mt-1 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5">
                <span className="text-[10px] font-medium text-primary">
                  {t('commandPalette.counts.filtersActive', { count: tokens.length })}
                </span>
              </div>
            )}

            {/* Counts / loading */}
            <div className="mt-auto flex flex-col gap-1 px-2.5 pb-1 pt-2">
              {issueLoading && (
                <span className="flex items-center gap-1 text-[10px] text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" /> {t('commandPalette.loading.searching')}
                </span>
              )}
              {!issueLoading && filteredIssueResults.length > 0 && (
                <span className="text-[10px] text-text-muted opacity-60">
                  {t('commandPalette.counts.issues', { count: filteredIssueResults.length })}
                  {tokens.length > 0 && baseResults.length !== filteredIssueResults.length && (
                    <span className="block opacity-70">{t('commandPalette.counts.ofTotal', { total: baseResults.length })}</span>
                  )}
                </span>
              )}
              {boards.length > 0 && (
                <span className="text-[10px] text-text-muted opacity-60">
                  {t('commandPalette.counts.boards', { count: boards.length })}
                </span>
              )}
            </div>
          </nav>

          {/* Results */}
          <div ref={listRef} className="flex-1 overflow-y-auto">

            {/* Inline create-board preview */}
            {createPreviewItem && (
              <div
                data-active={safeActiveIdx === flat.indexOf(createPreviewItem)}
                onMouseEnter={() => setActiveIdx(flat.indexOf(createPreviewItem))}
                onClick={createPreviewItem.action}
                className="cursor-pointer border-b border-surface-border/60"
              >
                <CreateBoardRow
                  active={safeActiveIdx === flat.indexOf(createPreviewItem)}
                  parsed={newBoardParsed!}
                  template={effectiveTemplate}
                  onTemplate={setCreateTemplate}
                  isPending={createBoard.isPending}
                />
              </div>
            )}

            {/* Empty state */}
            {(flat.length === 0 || (flat.length === 1 && createPreviewItem && !newBoardParsed?.ready && grouped.size === 0)) && !issueLoading ? (
              <div className="flex flex-col items-center gap-2 py-12">
                <p className="text-sm text-text-muted">
                  {tokens.length > 0 && !freeTextQuery
                    ? <><span className="font-medium text-text-primary">{t('commandPalette.emptyState.addSearchTerm')}</span></>
                    : query
                    ? <>{t('commandPalette.emptyState.noResults', { query: freeTextQuery || query })}</>
                    : t('commandPalette.emptyState.nothingYet')
                  }
                </p>
                {!query && !isSuggesting && (
                  <p className="text-xs text-text-muted opacity-50">
                    {t('commandPalette.emptyState.filterHint', { slash: '/' })}
                  </p>
                )}
              </div>
            ) : (
              <>
                {[...grouped.entries()].map(([group, items]) => (
                  <div key={group}>
                    <div className="flex items-center gap-2 px-4 pb-1 pt-3">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                        {t(`commandPalette.groups.${group.toLowerCase()}`, group)}
                      </span>
                      {(group === 'Boards' || group === 'Issues') && (
                        <span className="text-[10px] text-text-muted opacity-50">
                          {items.length}
                        </span>
                      )}
                    </div>

                    {items.map(cmd => {
                      const idx    = flat.indexOf(cmd)
                      const active = idx === safeActiveIdx
                      const Icon   = cmd.icon
                      return (
                        <button
                          key={cmd.id}
                          data-active={active}
                          onMouseEnter={() => setActiveIdx(idx)}
                          onClick={cmd.action}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                            active
                              ? 'bg-primary/8 text-text-primary'
                              : 'text-text-secondary hover:bg-surface-muted',
                          )}
                        >
                          <span className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                            active ? 'bg-primary/10' : 'bg-surface-muted',
                          )}>
                            {cmd.iconNode ?? (Icon
                              ? <Icon className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-text-muted')} />
                              : null
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-text-primary">
                              {cmd.label}
                            </span>
                            {cmd.description && (
                              <span className="block truncate text-xs text-text-muted">
                                {cmd.description}
                              </span>
                            )}
                          </span>

                          {cmd.shortcut && (
                            <span className="flex items-center gap-0.5">
                              {cmd.shortcut.map(k => <Kbd key={k}>{k}</Kbd>)}
                            </span>
                          )}
                          {active && (
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}

                {/* Hint when no query */}
                {!newBoardParsed && !query && tokens.length === 0 && (
                  <div className="flex items-center gap-2 border-t border-surface-border/40 px-4 py-2.5">
                    <ArrowRight className="h-3 w-3 shrink-0 text-text-muted opacity-30" />
                    <span className="text-[11px] text-text-muted opacity-50">
                      {t('commandPalette.hint.typeToSearch')}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center gap-4 border-t border-surface-border bg-surface-muted/50 px-5 py-2">
          {isSuggesting ? (
            <>
              <span className="flex items-center gap-1.5 text-[11px] text-primary">
                <Kbd>↑</Kbd><Kbd>↓</Kbd> {t('commandPalette.hint.navigate')}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-primary">
                <Kbd>↵</Kbd> {t('commandPalette.hint.apply')}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <Kbd>Esc</Kbd> {t('commandPalette.hint.dismiss')}
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <Kbd>↑</Kbd><Kbd>↓</Kbd> {t('commandPalette.hint.navigate')}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <Kbd>↵</Kbd> {t('commandPalette.hint.select')}
              </span>
              {newBoardParsed?.ready && (
                <span className="flex items-center gap-1.5 text-[11px] text-primary">
                  <Kbd>←</Kbd><Kbd>→</Kbd> {t('commandPalette.hint.template')}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <Kbd>Tab</Kbd> {t('commandPalette.hint.category')}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <Kbd>Esc</Kbd> {t('commandPalette.hint.close')}
              </span>
            </>
          )}
          <span className="ms-auto text-[11px] text-text-muted opacity-40">
            {t('commandPalette.hint.filterBar')}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
