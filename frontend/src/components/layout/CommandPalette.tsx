import {useEffect, useMemo, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import {useNavigate} from 'react-router-dom'
import Fuse from 'fuse.js'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {toast} from 'sonner'
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CirclePlus,
  Compass,
  Inbox,
  Layers,
  LayoutGrid,
  Plus,
  Search,
  Sparkles,
  UserCircle,
  X,
} from 'lucide-react'
import {boardsApi, useBoards} from '@/api/boards'
import {queryKeys} from '@/api/queryKeys'
import {cn} from '@/utils/cn'
import type {Board} from '@/types/board'

// ── Types ─────────────────────────────────────────────────────────────────────

type CategoryId = 'all' | 'boards' | 'new' | 'navigate'

type CommandItem = {
  id:           string
  group:        string
  icon?:        React.ElementType
  iconNode?:    React.ReactNode
  label:        string
  description?: string
  shortcut?:    string[]
  /** Marks the inline board-creation preview row */
  isCreatePreview?: boolean
  action:       () => void
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: { id: CategoryId; label: string; icon: React.ElementType }[] = [
  { id: 'all',      label: 'All',      icon: Search    },
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

/** Auto-generate a board key from a name: first letters, uppercase, max 4 */
function autoKey(name: string): string {
  const initials = name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').join('')
  return (initials || name.toUpperCase()).slice(0, 4)
}

const TEMPLATE_ALIASES: Record<string, Board['boardType']> = {
  kanban:       'KANBAN',
  scrum:        'SCRUM',
  bug:          'BUG_TRACKING',
  bugs:         'BUG_TRACKING',
  'bug-tracking': 'BUG_TRACKING',
  custom:       'CUSTOM',
}

type ParsedNewBoard = {
  key:              string
  name:             string
  ready:            boolean
  detectedTemplate: Board['boardType'] | null
}

/**
 * Parse "new board [KEY] [Name...] [template?]" from the query.
 * The last word is checked against template aliases and stripped from the name if matched.
 */
function parseNewBoard(query: string): ParsedNewBoard | null {
  const m = query.match(/^new\s+board(?:\s+(\S+)(?:\s+(.+))?)?$/i)
  if (!m) return null

  const rawKey  = (m[1] ?? '').toUpperCase().slice(0, 4)
  let   rawName = m[2]?.trim() ?? ''

  // Detect template keyword as the last word of the name
  let detectedTemplate: Board['boardType'] | null = null
  const words = rawName.split(/\s+/)
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
      className="inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded border border-surface-border bg-surface px-1.5 font-mono text-[10px] font-medium text-text-secondary"
      style={{ boxShadow: '0 2px 0 0 var(--color-surface-border)' }}
    >
      {children}
    </kbd>
  )
}

function BoardDot({ bg }: { bg: string }) {
  return <span className="h-3.5 w-3.5 rounded" style={{ backgroundColor: bg }} />
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
      active ? 'bg-primary/[0.08]' : 'bg-surface-muted/40',
    )}>
      <span className={cn(
        'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
        active ? 'bg-primary/10' : 'bg-surface-muted',
      )}>
        <Sparkles className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-text-muted')} />
      </span>

      <span className="min-w-0 flex-1">
        {/* Title */}
        <span className="block text-sm font-medium text-text-primary">
          {parsed.ready ? (
            <>
              Create <span className="text-primary">"{parsed.name}"</span>
              <span
                className="ms-2 font-mono text-xs text-text-muted"
                style={{ boxShadow: '0 1px 0 0 var(--color-surface-border)' }}
              >
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

        {/* Template picker */}
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
          {isPending
            ? <span className="text-text-muted">Creating…</span>
            : <><Kbd>↵</Kbd> create</>
          }
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
  const navigate                      = useNavigate()
  const queryClient                   = useQueryClient()
  const [query,          setQuery]         = useState('')
  const [category,       setCategory]      = useState<CategoryId>('all')
  const [activeIdx,      setActiveIdx]     = useState(0)
  const [createTemplate, setCreateTemplate] = useState<Board['boardType']>('KANBAN')
  const inputRef                      = useRef<HTMLInputElement>(null)
  const listRef                       = useRef<HTMLDivElement>(null)

  const { data: boards = [] } = useBoards()

  // ── Board creation mutation ────────────────────────────────────────────────

  const createBoard = useMutation({
    mutationFn: boardsApi.create,
    onSuccess: (board) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all('') })
      toast.success(`Board "${board.name}" created`)
      navigate(`/boards/${board.id}`)
      onClose()
    },
    onError: (err: any, variables) => {
      if (err?.response?.status === 409) {
        toast.error(`Key "${variables.boardKey}" already exists — pick a different key`)
      } else {
        toast.error('Failed to create board')
      }
    },
  })

  // ── Reset on open ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      setQuery('')
      setCategory('all')
      setActiveIdx(0)
      setCreateTemplate('KANBAN')
      const t = setTimeout(() => inputRef.current?.focus(), 20)
      return () => clearTimeout(t)
    }
  }, [open])

  // ── Board commands ─────────────────────────────────────────────────────────

  const boardFuse = useMemo(
    () => new Fuse(boards, { keys: ['name', 'boardKey'], threshold: 0.4 }),
    [boards],
  )

  const boardItems = useMemo<CommandItem[]>(
    () => boards.map(b => ({
      id:      `board-${b.id}`,
      group:   'Boards',
      iconNode: <BoardDot bg={b.background ?? '#6B7280'} />,
      label:       b.name,
      description: b.boardKey,
      action: () => { navigate(`/boards/${b.id}`); onClose() },
    })),
    [boards, navigate, onClose],
  )

  // ── Static commands ────────────────────────────────────────────────────────

  const staticCommands = useMemo<CommandItem[]>(() => [
    // ── New ──────────────────────────────────────────────────────────────────
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
      action: () => { onClose(); onCreateIssue?.() },
    },
    // ── Navigate ──────────────────────────────────────────────────────────────
    {
      id: 'nav-all-boards', group: 'Navigate',
      icon: LayoutGrid, label: 'All Boards',
      description: 'Browse all your boards',
      action: () => { navigate('/boards'); onClose() },
    },
    {
      id: 'nav-my-issues', group: 'Navigate',
      icon: Layers, label: 'My Issues',
      action: () => { navigate('/my-issues'); onClose() },
    },
    {
      id: 'nav-calendar', group: 'Navigate',
      icon: CalendarDays, label: 'Calendar',
      action: () => { navigate('/calendar'); onClose() },
    },
    {
      id: 'nav-inbox', group: 'Navigate',
      icon: Inbox, label: 'Inbox',
      action: () => { navigate('/inbox'); onClose() },
    },
    {
      id: 'nav-profile', group: 'Navigate',
      icon: UserCircle, label: 'Profile Settings',
      action: () => { navigate('/settings/profile'); onClose() },
    },
  ], [navigate, onClose, onCreateIssue])

  // ── Inline "new board" detection ───────────────────────────────────────────

  const newBoardParsed = useMemo(() => parseNewBoard(query), [query])

  // Query-detected template takes priority over manually chosen one
  const effectiveTemplate = newBoardParsed?.detectedTemplate ?? createTemplate

  // ── Combined results ───────────────────────────────────────────────────────

  const results = useMemo<CommandItem[]>(() => {
    const q = query.trim()

    // Always surface the create-preview when the prefix is typed
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

    // Filter boards
    let filteredBoards: CommandItem[]
    if (newBoardParsed) {
      filteredBoards = []                           // hide board list while creating
    } else if (!q) {
      filteredBoards = boardItems
    } else {
      filteredBoards = boardFuse.search(q).map(r =>
        boardItems.find(item => item.id === `board-${r.item.id}`)!,
      ).filter(Boolean)
    }

    // Filter static commands
    const filteredStatic = (() => {
      const words = q.toLowerCase().split(/\s+/).filter(Boolean)
      return staticCommands.filter(cmd => {
        // Category gate
        if (category === 'new'      && cmd.group !== 'New')      return false
        if (category === 'navigate' && cmd.group !== 'Navigate') return false
        if (category === 'boards'   && cmd.group !== 'New' && cmd.id !== 'new-board-hint') return false
        // For 'boards' category we only keep the board create hint + board items
        if (category === 'boards' && cmd.id !== 'new-board-hint') return false

        if (!words.length) return true
        const hay = `${cmd.label} ${cmd.description ?? ''} ${cmd.group}`.toLowerCase()
        return words.every(w => hay.includes(w))
      })
    })()

    // Boards category: show board items + the "create board" hint
    if (category === 'boards') {
      return [...createPreview, ...filteredBoards, ...filteredStatic]
    }
    // New category: only create commands + creation preview
    if (category === 'new') {
      return [...createPreview, ...filteredStatic]
    }
    // Navigate: only nav commands
    if (category === 'navigate') {
      return [...filteredStatic]
    }
    // All
    return [...createPreview, ...filteredBoards, ...filteredStatic]
  }, [query, category, boardItems, boardFuse, staticCommands, newBoardParsed, createBoard, effectiveTemplate])

  // ── Grouped ────────────────────────────────────────────────────────────────

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>()
    for (const cmd of results) {
      if (cmd.isCreatePreview) continue   // rendered separately at top
      const arr = map.get(cmd.group) ?? []
      arr.push(cmd)
      map.set(cmd.group, arr)
    }
    return map
  }, [results])

  const createPreviewItem = results.find(r => r.isCreatePreview) ?? null

  // The flat list for arrow navigation includes the preview item at index 0
  const flat = results

  // ── Keep activeIdx in bounds ───────────────────────────────────────────────

  useEffect(() => {
    setActiveIdx(i => Math.min(i, Math.max(0, flat.length - 1)))
  }, [flat.length])

  // ── Scroll active item into view ───────────────────────────────────────────

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  // ── Keyboard handler ───────────────────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent) {
    // Left/right: cycle template when create-preview is active and cursor is at end
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

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => (i + 1) % Math.max(1, flat.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => (i - 1 + Math.max(1, flat.length)) % Math.max(1, flat.length))
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const idx = CATEGORIES.findIndex(c => c.id === category)
      const next = CATEGORIES[(idx + (e.shiftKey ? -1 + CATEGORIES.length : 1)) % CATEGORIES.length]
      setCategory(next.id)
      setActiveIdx(0)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      flat[activeIdx]?.action()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  // ── Render ─────────────────────────────────────────────────────────────────

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[11vh]"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="animate-backdrop-in absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="animate-palette-in relative flex w-3/4 max-w-3xl flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl"
        style={{ maxHeight: '66vh' }}
      >
        {/* Search row — full width */}
        <div className="flex items-center gap-3 border-b border-surface-border px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
            onKeyDown={handleKeyDown}
            placeholder={
              category === 'boards'   ? 'Search boards or type: new board KEY Name…' :
              category === 'new'      ? 'Type: new board KEY Name  or  create issue…' :
              category === 'navigate' ? 'Jump to a page…' :
              'Search boards, create, navigate…'
            }
            className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="rounded p-0.5 text-text-muted hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg border border-surface-border px-2 py-1 text-[11px] text-text-muted hover:bg-surface-muted hover:text-text-primary"
          >
            Esc
          </button>
        </div>

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

            {/* Board count hint */}
            {boards.length > 0 && (
              <div className="mt-auto px-2.5 pb-1 pt-2">
                <span className="text-[10px] text-text-muted opacity-60">
                  {boards.length} board{boards.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </nav>

          {/* Results */}
          <div ref={listRef} className="flex-1 overflow-y-auto">

            {/* Inline create-board preview — always on top when present */}
            {createPreviewItem && (
              <div
                data-active={activeIdx === flat.indexOf(createPreviewItem)}
                onMouseEnter={() => setActiveIdx(flat.indexOf(createPreviewItem))}
                onClick={createPreviewItem.action}
                className="cursor-pointer border-b border-surface-border/60"
              >
                <CreateBoardRow
                  active={activeIdx === flat.indexOf(createPreviewItem)}
                  parsed={newBoardParsed!}
                  template={effectiveTemplate}
                  onTemplate={setCreateTemplate}
                  isPending={createBoard.isPending}
                />
              </div>
            )}

            {/* Empty state */}
            {flat.length === 0 || (flat.length === 1 && createPreviewItem && !newBoardParsed?.ready && grouped.size === 0) ? (
              <div className="flex flex-col items-center gap-2 py-12">
                <p className="text-sm text-text-muted">
                  {query ? <>No results for <span className="font-medium text-text-primary">"{query}"</span></> : 'Nothing here yet'}
                </p>
              </div>
            ) : (
              <>
                {[...grouped.entries()].map(([group, items]) => (
                  <div key={group}>
                    {/* Group header */}
                    <div className="flex items-center gap-2 px-4 pb-1 pt-3">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                        {group}
                      </span>
                      {group === 'Boards' && (
                        <span className="text-[10px] text-text-muted opacity-50">
                          {items.length}
                        </span>
                      )}
                    </div>

                    {/* Items */}
                    {items.map(cmd => {
                      const idx    = flat.indexOf(cmd)
                      const active = idx === activeIdx
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
                              ? 'bg-primary/[0.08] text-text-primary'
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

                {/* Coming soon hint */}
                {!newBoardParsed && (
                  <div className="flex items-center gap-2 border-t border-surface-border/40 px-4 py-2.5">
                    <ArrowRight className="h-3 w-3 shrink-0 text-text-muted opacity-30" />
                    <span className="text-[11px] text-text-muted opacity-50">
                      Issue search, member lookup and more coming soon
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center gap-4 border-t border-surface-border bg-surface-muted/50 px-5 py-2">
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
          <span className="ms-auto text-[11px] text-text-muted opacity-40">
            <kbd className="font-mono">/</kbd> or <kbd className="font-mono">⌘K</kbd> to open
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
