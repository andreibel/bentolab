import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react'
import { cn } from '@/utils/cn'

// ── Helpers ────────────────────────────────────────────────────────────────────

export function toDatePart(dateStr: string): string {
  return dateStr.split('T')[0]
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function fmtDateDisplay(dateStr: string): string {
  return new Date(toDatePart(dateStr) + 'T12:00:00').toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// ── MiniCalendar ───────────────────────────────────────────────────────────────

const WEEKDAYS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function MiniCalendar({
  value,
  onChange,
  minDate,
  maxDate,
}: {
  value: string
  onChange: (v: string) => void
  minDate?: string
  maxDate?: string
}) {
  const effectiveValue = value || todayStr()
  const selected = useMemo(() => new Date(toDatePart(effectiveValue) + 'T12:00:00'), [effectiveValue])
  const [view, setView] = useState({ year: selected.getFullYear(), month: selected.getMonth() })

  const prevMonth = useCallback(() => {
    setView(v => { const d = new Date(v.year, v.month - 1); return { year: d.getFullYear(), month: d.getMonth() } })
  }, [])
  const nextMonth = useCallback(() => {
    setView(v => { const d = new Date(v.year, v.month + 1); return { year: d.getFullYear(), month: d.getMonth() } })
  }, [])

  const firstDayOfWeek = new Date(view.year, view.month, 1).getDay()
  const daysInMonth    = new Date(view.year, view.month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function dayStr(day: number): string {
    return `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function isSelected(day: number) {
    return value && toDatePart(value) === dayStr(day)
  }

  function isToday(day: number) {
    return todayStr() === dayStr(day)
  }

  function isDisabled(day: number) {
    const d = dayStr(day)
    if (minDate && d < toDatePart(minDate)) return true
    if (maxDate && d > toDatePart(maxDate)) return true
    return false
  }

  return (
    <div className="select-none rounded-xl border border-surface-border bg-surface p-4 shadow-xl">
      {/* Month navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={prevMonth}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-text-primary">
          {MONTH_NAMES[view.month]} {view.year}
        </span>
        <button type="button" onClick={nextMonth}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAYS.map(d => (
          <div key={d} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-text-muted">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => (
          <div key={i} className="flex items-center justify-center">
            {day !== null ? (
              <button
                type="button"
                disabled={isDisabled(day)}
                onClick={() => !isDisabled(day) && onChange(dayStr(day))}
                className={cn(
                  'h-9 w-9 rounded-lg text-sm transition-colors',
                  isDisabled(day) && 'cursor-not-allowed opacity-30',
                  !isDisabled(day) && isSelected(day) && 'bg-primary font-semibold text-white shadow-sm',
                  !isDisabled(day) && !isSelected(day) && isToday(day) && 'font-semibold text-primary ring-1 ring-primary hover:bg-primary/10',
                  !isDisabled(day) && !isSelected(day) && !isToday(day) && 'text-text-primary hover:bg-surface-muted',
                )}
              >
                {day}
              </button>
            ) : (
              <div className="h-9 w-9" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── DatePicker (popover) ───────────────────────────────────────────────────────

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  minDate,
  maxDate,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minDate?: string
  maxDate?: string
  className?: string
}) {
  const [open, setOpen]   = useState(false)
  const [pos, setPos]     = useState({ top: 0, left: 0 })
  const triggerRef        = useRef<HTMLButtonElement>(null)
  const popoverRef        = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        !popoverRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleOpen() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const calH = 340
      const top = spaceBelow >= calH ? rect.bottom + 4 : rect.top - calH - 4
      setPos({ top, left: rect.left })
    }
    setOpen(v => !v)
  }

  function handleSelect(v: string) {
    onChange(v)
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md border border-surface-border bg-surface px-2 py-1',
          'text-xs outline-none transition-colors hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20',
          open && 'border-primary ring-1 ring-primary/20',
          className,
        )}
      >
        <CalendarDays className="h-3 w-3 shrink-0 text-text-muted" />
        <span className={cn('flex-1 text-start', value ? 'text-text-primary' : 'text-text-muted')}>
          {value ? fmtDateDisplay(value) : placeholder}
        </span>
        {value && (
          <span
            onClick={handleClear}
            role="button"
            className="rounded p-0.5 text-text-muted hover:bg-surface-muted hover:text-text-primary"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
        >
          <MiniCalendar
            value={value}
            onChange={handleSelect}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>,
        document.body
      )}
    </>
  )
}