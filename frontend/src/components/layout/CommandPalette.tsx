import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import {useNavigate} from 'react-router-dom'
import Fuse from 'fuse.js'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {toast} from 'sonner'
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CircleDot,
  CirclePlus,
  Compass,
  Inbox,
  Layers,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  User,
  UserCheck,
  UserCircle,
  X,
} from 'lucide-react'
import {boardsApi, useBoards} from '@/api/boards'
import {issuesApi} from '@/api/issues'
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

type SlashCommandDef = {
  id:          SlashCommandId
  label:       string
  description: string
  icon:        React.ElementType
  valueType:   'user' | 'date'
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
  { id: 'assigned-to',  label: 'Assigned to',  description: 'Filter by assignee',      icon: UserCheck,    valueType: 'user' },
  { id: 'created-by',   label: 'Created by',   description: 'Filter by issue creator', icon: UserCircle,   valueType: 'user' },
  { id: 'start-after',  label: 'Start after',  description: 'Started after a date',    icon: CalendarDays, valueType: 'date' },
  { id: 'start-before', label: 'Start before', description: 'Started before a date',   icon: CalendarDays, valueType: 'date' },
  { id: 'due-after',    label: 'Due after',    description: 'Due date is after',        icon: CalendarDays, valueType: 'date' },
  { id: 'due-before',   label: 'Due before',   description: 'Due date is before',       icon: CalendarDays, valueType: 'date' },
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
      default:             return true
    }
  }))
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: { id: CategoryId; label: string; icon: React.ElementType }[] = [
  { id: 'all',      label: 'All',      icon: Search     },
  { id: 'issues',   label: 'Issues',   icon: CircleDot  },
  { id: 'boards',   label: 'Boards',   icon: LayoutGrid },
  { id: 'new',      label: 'New',      icon: Plus       },
  { id: 'navigate', label: 'Navigate', icon: Compass    },
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
                new board KEY Name
              </kbd>
            </span>
          )}
        </span>

        {parsed.ready && (
          <span className="mt-1.5 flex flex-wrap items-center gap-1">
            <span className="me-0.5 text-[10px] text-text-muted">Template:</span>
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
          {isPending ? <span className="text-text-muted">Creating…</span> : <><Kbd>↵</Kbd> create</>}
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

  const needsUsers = slashState.type === 'value' && slashState.command.valueType === 'user'

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
  }, [slashState, currentUser, orgMembers, profileMap])

  // Reset suggestion index when suggestions change
  useEffect(() => { setSuggestionIdx(0) }, [suggestions.length])

  // ── Issue search (debounced, backend) ─────────────────────────────────────

  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [issueResults,   setIssueResults]   = useState<IssueSearchResult[]>([])
  const [issueLoading,   setIssueLoading]   = useState(false)

  // The free-text portion of the query (excludes the current in-progress slash segment)
  const freeTextQuery = useMemo(() => {
    if (slashState.type === 'none') return query.trim()
    return query.slice(0, slashState.replaceFrom).trimEnd()
  }, [query, slashState])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(freeTextQuery), 300)
    return () => clearTimeout(t)
  }, [freeTextQuery])

  useEffect(() => {
    const q           = debouncedQuery
    const shouldSearch = q.length >= 2 && (category === 'all' || category === 'issues')
    if (!shouldSearch) { setIssueResults([]); return }
    let cancelled = false
    setIssueLoading(true)
    issuesApi.search(q, 20)
      .then(data  => { if (!cancelled) setIssueResults(data)  })
      .catch(()   => { if (!cancelled) setIssueResults([])    })
      .finally(() => { if (!cancelled) setIssueLoading(false) })
    return () => { cancelled = true }
  }, [debouncedQuery, category])

  // Apply token filters client-side
  const filteredIssueResults = useMemo(
    () => applyTokenFilters(issueResults, tokens),
    [issueResults, tokens],
  )

  // ── Board creation mutation ───────────────────────────────────────────────

  const createBoard = useMutation({
    mutationFn: boardsApi.create,
    onSuccess: (board) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.all('') })
      toast.success(`Board "${board.name}" created`)
      navigate(`/boards/${board.id}`)
      handleClose()
    },
    onError: (err: unknown, variables) => {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 409) {
        toast.error(`Key "${variables.boardKey}" already exists — pick a different key`)
      } else {
        toast.error('Failed to create board')
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
    setIssueResults([])
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
      if (cmd.valueType === 'date') return `Pick a date: today, tomorrow, this-week…`
      return `Type a name or "me"…`
    }
    if (slashState.type === 'command') return `Type a command name or pick from the list…`
    if (category === 'issues')         return 'Search issues, descriptions, comments… or use / for filters'
    if (category === 'boards')         return 'Search boards or type: new board KEY Name…'
    if (category === 'new')            return 'Type: new board KEY Name  or  create issue…'
    if (category === 'navigate')       return 'Jump to a page…'
    return 'Search or type / for filter commands…'
  }, [slashState, category])

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
                {slashState.type === 'command' ? 'Commands' : `/${slashState.command.id} — choose a value`}
              </span>
              <span className="ms-auto text-[10px] text-text-muted opacity-40">
                <Kbd>↑</Kbd><Kbd>↓</Kbd> navigate · <Kbd>↵</Kbd> select · <Kbd>Esc</Kbd> dismiss
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
                  {cat.label}
                </button>
              )
            })}

            {/* Active filter token count */}
            {tokens.length > 0 && (
              <div className="mt-1 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5">
                <span className="text-[10px] font-medium text-primary">
                  {tokens.length} filter{tokens.length !== 1 ? 's' : ''} active
                </span>
              </div>
            )}

            {/* Counts / loading */}
            <div className="mt-auto flex flex-col gap-1 px-2.5 pb-1 pt-2">
              {issueLoading && (
                <span className="flex items-center gap-1 text-[10px] text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" /> searching…
                </span>
              )}
              {!issueLoading && filteredIssueResults.length > 0 && (
                <span className="text-[10px] text-text-muted opacity-60">
                  {filteredIssueResults.length} issue{filteredIssueResults.length !== 1 ? 's' : ''}
                  {tokens.length > 0 && issueResults.length !== filteredIssueResults.length && (
                    <span className="block opacity-70">of {issueResults.length}</span>
                  )}
                </span>
              )}
              {boards.length > 0 && (
                <span className="text-[10px] text-text-muted opacity-60">
                  {boards.length} board{boards.length !== 1 ? 's' : ''}
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
                    ? <><span className="font-medium text-text-primary">Add a search term</span> to use filters</>
                    : query
                    ? <>No results for <span className="font-medium text-text-primary">"{freeTextQuery || query}"</span></>
                    : 'Nothing here yet'
                  }
                </p>
                {!query && !isSuggesting && (
                  <p className="text-xs text-text-muted opacity-50">
                    Type <span className="font-mono text-primary">/</span> for filter commands
                  </p>
                )}
              </div>
            ) : (
              <>
                {[...grouped.entries()].map(([group, items]) => (
                  <div key={group}>
                    <div className="flex items-center gap-2 px-4 pb-1 pt-3">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                        {group}
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
                      Type to search · <span className="font-mono text-primary/70">/</span> for filter commands
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
                <Kbd>↑</Kbd><Kbd>↓</Kbd> navigate
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-primary">
                <Kbd>↵</Kbd> apply
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <Kbd>Esc</Kbd> dismiss
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <Kbd>↑</Kbd><Kbd>↓</Kbd> navigate
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <Kbd>↵</Kbd> select
              </span>
              {newBoardParsed?.ready && (
                <span className="flex items-center gap-1.5 text-[11px] text-primary">
                  <Kbd>←</Kbd><Kbd>→</Kbd> template
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <Kbd>Tab</Kbd> category
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <Kbd>Esc</Kbd> close
              </span>
            </>
          )}
          <span className="ms-auto text-[11px] text-text-muted opacity-40">
            <kbd className="font-mono text-primary">/</kbd> for filters · <kbd className="font-mono">⌘K</kbd> to open
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
