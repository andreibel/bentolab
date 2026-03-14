import {useEffect, useMemo, useRef, useState} from 'react'
import Fuse from 'fuse.js'
import {Check, ChevronDown, Pencil, Search, X} from 'lucide-react'
import {cn} from '@/utils/cn'
import type {Epic} from '@/types/epic'

export function EpicFilter({
  epics,
  selected,
  onChange,
  onEditEpic,
}: {
  epics: Epic[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
  onEditEpic?: (epicId: string) => void
}) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const ref               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const fuse    = useMemo(() => new Fuse(epics, { keys: ['title'], threshold: 0.4 }), [epics])
  const results = query.trim() ? fuse.search(query).map(r => r.item) : epics

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }

  function clearAll() {
    onChange(new Set())
    setQuery('')
  }

  // ── Trigger label ──────────────────────────────────────────────────────────

  let triggerContent: React.ReactNode

  if (selected.size === 0) {
    triggerContent = (
      <span className="text-text-secondary">
        Epic <ChevronDown className="ms-0.5 inline h-3 w-3 opacity-60" />
      </span>
    )
  } else if (selected.size === 1) {
    const epic = epics.find(e => selected.has(e.id))
    triggerContent = epic ? (
      <>
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: epic.color }} />
        <span className="max-w-[110px] truncate">{epic.title}</span>
        <X
          className="h-3 w-3 shrink-0 opacity-60 hover:opacity-100"
          onClick={e => { e.stopPropagation(); clearAll() }}
        />
      </>
    ) : null
  } else {
    const dots = epics.filter(e => selected.has(e.id)).slice(0, 4)
    triggerContent = (
      <>
        <span className="flex items-center -space-x-1.5">
          {dots.map(e => (
            <span
              key={e.id}
              className="h-3 w-3 shrink-0 rounded-full ring-1 ring-surface"
              style={{ backgroundColor: e.color }}
            />
          ))}
        </span>
        <span>{selected.size} epics</span>
        <X
          className="h-3 w-3 shrink-0 opacity-60 hover:opacity-100"
          onClick={e => { e.stopPropagation(); clearAll() }}
        />
      </>
    )
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors',
          selected.size > 0
            ? 'border-primary/40 bg-primary/5 text-primary'
            : 'border-surface-border text-text-secondary hover:border-primary/30 hover:text-text-primary',
        )}
      >
        {triggerContent}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute start-0 top-full z-50 mt-1 w-64 rounded-xl border border-surface-border bg-surface shadow-xl">

          {/* Search box */}
          <div className="p-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-muted px-2 py-1.5">
              <Search className="h-3 w-3 shrink-0 text-text-muted" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search epics…"
                className="flex-1 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-muted"
              />
              {query && (
                <X
                  className="h-3 w-3 cursor-pointer text-text-muted hover:text-text-primary"
                  onClick={() => setQuery('')}
                />
              )}
            </div>
          </div>

          {/* "All" row — only when not searching */}
          {!query.trim() && (
            <button
              onClick={clearAll}
              className={cn(
                'flex w-full items-center gap-2.5 border-b border-surface-border/60 px-3 py-2 text-xs transition-colors hover:bg-surface-muted',
                selected.size === 0 ? 'text-primary' : 'text-text-primary',
              )}
            >
              <span className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                selected.size === 0
                  ? 'border-primary bg-primary'
                  : 'border-surface-border',
              )}>
                {selected.size === 0 && <Check className="h-2.5 w-2.5 text-white" />}
              </span>
              All epics
            </button>
          )}

          {/* Epic list */}
          <div className="max-h-60 overflow-y-auto">
            {results.length === 0 ? (
              <p className="px-3 py-5 text-center text-xs text-text-muted">No epics match</p>
            ) : (
              results.map(epic => {
                const checked = selected.has(epic.id)
                return (
                  <div key={epic.id} className="group/epic flex items-center hover:bg-surface-muted">
                    <button
                      onClick={() => toggle(epic.id)}
                      className="flex flex-1 items-center gap-2.5 px-3 py-2 text-xs"
                    >
                      <span className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        checked ? 'border-primary bg-primary' : 'border-surface-border',
                      )}>
                        {checked && <Check className="h-2.5 w-2.5 text-white" />}
                      </span>
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: epic.color }}
                      />
                      <span className="flex-1 truncate text-start text-text-primary">
                        {epic.title}
                      </span>
                    </button>
                    {onEditEpic && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditEpic(epic.id) }}
                        className="me-2 rounded p-1 text-text-muted opacity-0 transition-all hover:text-primary group-hover/epic:opacity-100"
                        aria-label="Edit epic"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between border-t border-surface-border px-3 py-2">
              <span className="text-[11px] text-text-muted">
                {selected.size} of {epics.length} selected
              </span>
              <button
                onClick={clearAll}
                className="text-[11px] text-primary hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
