/**
 * Animated board mockup for the landing page hero.
 * A single card cycles through all four columns: To Do → In Progress → In Review → Done → reset.
 */
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, BookOpen, Bug, CheckSquare, MessageSquare, Minus } from 'lucide-react'

// ── Layout constants (internal 880 × 420 canvas) ──────────────────────────────

const BOARD_W = 880
const BOARD_H = 420

const PAD           = 16   // outer padding around columns area
const HEADER_H      = 44   // top board header bar height
const COL_W         = 195  // each column width  (4 cols + 3 gaps + 2 pads = 848 ≤ 880)
const COL_GAP       = 12   // gap between columns
const COL_HEADER_H  = 32   // column title row height
const CARD_H        = 74   // approximate rendered card height
const CARD_GAP      = 8    // gap between cards inside a column
const COL_INNER_PAD = 8    // padding inside column body (top, sides, bottom)

const CARD_W = COL_W - COL_INNER_PAD * 2  // = 179 px

// Easing curves
const easeOut:  [number, number, number, number] = [0.22, 1, 0.36, 1]
const easeSnap: [number, number, number, number] = [0.25, 1, 0.5,  1]

function colLeft(i: number) {
  return PAD + i * (COL_W + COL_GAP)
}
function cardTop(idx: number) {
  return HEADER_H + PAD + COL_HEADER_H + COL_INNER_PAD + idx * (CARD_H + CARD_GAP)
}

// The animated card always occupies slot index 2 (third slot) in each column.
// All four positions share the same Y — the drag is a pure horizontal sweep.
const SLOT_IDX = 2

const CARD_POSITIONS = [0, 1, 2, 3].map((i) => ({
  x: colLeft(i) + COL_INNER_PAD,
  y: cardTop(SLOT_IDX),
}))

const CUR_OX = 108   // cursor x offset from card top-left
const CUR_OY = 26    // cursor y offset from card top-left

// ── Phase state machine ────────────────────────────────────────────────────────

type Phase =
  | 'idle'       // card resting, cursor hidden
  | 'approach'   // cursor fades in, glides to card
  | 'lifting'    // card lifts off (source slot fades to ghost)
  | 'dragging'   // cursor + floating card sweep to next column
  | 'dropping'   // card arrives, scale snaps back
  | 'settled'    // card visible in new column, cursor gone
  | 'resetting'  // after Done: card fades, snaps back to col 0

// How long each phase lasts (ms)
const PHASE_MS: Record<Phase, number> = {
  idle:      2000,
  approach:   550,
  lifting:    200,
  dragging:  1200,
  dropping:   260,
  settled:   1700,  // bumped to 2400 when landing on Done (see effect)
  resetting:  440,
}

// ── Card data ─────────────────────────────────────────────────────────────────

type Priority  = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
type IssueType = 'BUG' | 'TASK' | 'STORY'

interface MockCard {
  key: string
  title: string
  type: IssueType
  priority: Priority
  points?: number
  comments?: number
}

// Two base cards per column (always static), plus the animated slot at idx 2.
const BASE_CARDS: Record<number, [MockCard, MockCard]> = {
  0: [
    { key: 'AUTH-12', title: 'Set up auth flow',           type: 'BUG',   priority: 'HIGH'     },
    { key: 'UI-08',   title: 'Dark mode toggle',            type: 'TASK',  priority: 'MEDIUM'   },
  ],
  1: [
    { key: 'AUTH-15', title: 'Fix login redirect on timeout', type: 'BUG',   priority: 'CRITICAL', comments: 3 },
    { key: 'FE-03',   title: 'Sidebar navigation refactor',   type: 'TASK',  priority: 'MEDIUM'              },
  ],
  2: [
    { key: 'BRD-02', title: 'Sprint board UI improvements', type: 'STORY', priority: 'MEDIUM', comments: 2 },
    { key: 'INF-01', title: 'Docker compose health checks', type: 'TASK',  priority: 'LOW'                },
  ],
  3: [
    { key: 'API-07', title: 'API rate limiting middleware', type: 'TASK', priority: 'LOW',    points: 3 },
    { key: 'DOC-05', title: 'OpenAPI schema generation',   type: 'TASK', priority: 'MEDIUM'            },
  ],
}

// The card that travels between columns
const TRAVELER: MockCard = {
  key: 'DSH-04',
  title: 'Dashboard analytics overview',
  type: 'STORY',
  priority: 'HIGH',
  points: 5,
  comments: 2,
}

// Column metadata
const COLS = [
  { name: 'To Do',       color: '#6B7280', hlBorder: 'border-slate-400/50',   hlBg: 'bg-slate-400/5'  },
  { name: 'In Progress', color: '#3B82F6', hlBorder: 'border-blue-400/50',    hlBg: 'bg-blue-400/5'   },
  { name: 'In Review',   color: '#8B5CF6', hlBorder: 'border-violet-400/50',  hlBg: 'bg-violet-400/5' },
  { name: 'Done',        color: '#22C55E', hlBorder: 'border-green-400/50',   hlBg: 'bg-green-400/5'  },
]

// ── Micro-components ──────────────────────────────────────────────────────────

function PriorityIcon({ priority }: { priority: Priority }) {
  if (priority === 'CRITICAL') return <ArrowUp    className="h-3 w-3 flex-shrink-0 text-red-500"    />
  if (priority === 'HIGH')     return <ArrowUp    className="h-3 w-3 flex-shrink-0 text-orange-500" />
  if (priority === 'MEDIUM')   return <Minus      className="h-3 w-3 flex-shrink-0 text-yellow-500" />
  return                              <ArrowDown  className="h-3 w-3 flex-shrink-0 text-blue-400"   />
}

function TypeBadge({ type }: { type: IssueType }) {
  const cfg = {
    BUG:   { icon: <Bug         className="h-3 w-3" />, cls: 'text-red-500 bg-red-500/10',          label: 'BUG'   },
    TASK:  { icon: <CheckSquare className="h-3 w-3" />, cls: 'text-blue-500 bg-blue-500/10',        label: 'TASK'  },
    STORY: { icon: <BookOpen    className="h-3 w-3" />, cls: 'text-emerald-500 bg-emerald-500/10',  label: 'STORY' },
  } as const
  const { icon, cls, label } = cfg[type]
  return (
    <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${cls}`}>
      {icon}{label}
    </span>
  )
}

function Card({ card, ghost = false, dragging = false }: {
  card: MockCard
  ghost?: boolean
  dragging?: boolean
}) {
  return (
    <div
      className={`rounded-lg border bg-surface p-3 ${
        dragging
          ? 'border-primary/40 shadow-xl ring-2 ring-primary/20'
          : 'border-surface-border'
      }`}
      style={{ width: CARD_W, opacity: ghost ? 0.2 : 1 }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <TypeBadge type={card.type} />
        <PriorityIcon priority={card.priority} />
      </div>
      <p className="mb-2 line-clamp-2 text-[12px] font-medium leading-snug text-text-primary">
        {card.title}
      </p>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-text-muted">{card.key}</span>
        <div className="flex items-center gap-1.5">
          {card.points != null && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded bg-surface-muted px-1 text-[10px] font-semibold text-text-secondary">
              {card.points}
            </span>
          )}
          {(card.comments ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
              <MessageSquare className="h-3 w-3" />
              {card.comments}
            </span>
          )}
          <div className="h-5 w-5 rounded-full border border-surface-border bg-primary/20" />
        </div>
      </div>
    </div>
  )
}

function BoardHeader() {
  return (
    <div
      className="flex items-center gap-2.5 border-b border-surface-border bg-surface px-4"
      style={{ height: HEADER_H }}
    >
      <div className="h-3 w-3 flex-shrink-0 rounded-full bg-primary/70" />
      <span className="text-[13px] font-semibold text-text-primary">Bento Platform</span>
      <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-text-muted">BENTO</span>
      <div className="flex-1" />
      <div className="flex -space-x-1.5">
        {[
          { bg: '#5B47E0', opacity: 0.85 },
          { bg: '#F97316', opacity: 0.75 },
          { bg: '#22C55E', opacity: 0.70 },
        ].map((a, i) => (
          <div key={i} className="h-6 w-6 rounded-full border-2 border-surface"
            style={{ backgroundColor: a.bg, opacity: a.opacity }} />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-6 w-16 rounded border border-surface-border bg-surface-muted" />
        <div className="flex h-6 items-center justify-center rounded bg-primary/90 px-2.5">
          <span className="text-[10px] font-semibold text-white">+ Add issue</span>
        </div>
      </div>
    </div>
  )
}

// ── Animation helpers ─────────────────────────────────────────────────────────
//
// During lifting/dragging/dropping  → homeCol = SOURCE column (not yet updated)
// During settled/resetting          → homeCol = DEST column   (just updated)
// This means CARD_POSITIONS[homeCol] always points to the card's current home.

function getSlotOpacity(col: number, homeCol: number, phase: Phase): number {
  const isHome = col === homeCol
  switch (phase) {
    case 'idle':
    case 'approach':    return isHome ? 1   : 0
    case 'lifting':
    case 'dragging':
    case 'dropping':    return isHome ? 0.2 : 0   // ghost at source
    case 'settled':     return isHome ? 1   : 0   // card arrived at dest
    case 'resetting':   return 0                  // fading out at Done
  }
}

function cardInCol(col: number, homeCol: number, phase: Phase): boolean {
  // Count the traveler card as being "in" col for header count purposes
  return (
    (phase === 'idle' || phase === 'approach' || phase === 'settled') &&
    col === homeCol
  )
}

function getFloatingAnimate(phase: Phase, homeCol: number) {
  const src = CARD_POSITIONS[homeCol]
  const dst = CARD_POSITIONS[(homeCol + 1) % 4]
  switch (phase) {
    case 'idle':
    case 'approach':    return { x: src.x, y: src.y, opacity: 0,    scale: 1    }
    case 'lifting':     return { x: src.x, y: src.y, opacity: 0.96, scale: 1.03 }
    case 'dragging':    return { x: dst.x, y: dst.y, opacity: 0.96, scale: 1.03 }
    case 'dropping':    return { x: dst.x, y: dst.y, opacity: 0.96, scale: 1    }
    // In settled & resetting: homeCol already updated → src = dest position
    case 'settled':
    case 'resetting':   return { x: src.x, y: src.y, opacity: 0,    scale: 1    }
  }
}

function getFloatingTransition(phase: Phase) {
  switch (phase) {
    case 'lifting':   return { duration: 0.18 }
    case 'dragging':  return { duration: 1.15, ease: easeOut  }
    case 'dropping':  return { duration: 0.2,  ease: easeSnap }
    case 'settled':
    case 'resetting': return { duration: 0.2 }
    default:          return { duration: 0 }
  }
}

function getCursorAnimate(phase: Phase, homeCol: number) {
  const src = CARD_POSITIONS[homeCol]
  const dst = CARD_POSITIONS[(homeCol + 1) % 4]
  const atSrc = { x: src.x + CUR_OX, y: src.y + CUR_OY }
  const atDst = { x: dst.x + CUR_OX, y: dst.y + CUR_OY }
  switch (phase) {
    case 'idle':        return { ...atSrc, opacity: 0 }
    case 'approach':
    case 'lifting':     return { ...atSrc, opacity: 1 }
    case 'dragging':
    case 'dropping':    return { ...atDst, opacity: 1 }
    // settled/resetting: homeCol = dest, so atSrc = cursor at dest position
    case 'settled':
    case 'resetting':   return { ...atSrc, opacity: 0 }
  }
}

function getCursorTransition(phase: Phase) {
  switch (phase) {
    case 'approach': return { duration: 0.3 }
    case 'dragging': return { duration: 1.15, ease: easeOut }
    case 'settled':  return { duration: 0.28 }
    default:         return { duration: 0 }
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

export function HeroBoardMockup() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setScale(el.offsetWidth / BOARD_W)
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / BOARD_W)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // homeCol: which column the traveler card currently lives in (0–3)
  const [homeCol, setHomeCol] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>

    switch (phase) {
      case 'idle':
        t = setTimeout(() => setPhase('approach'), PHASE_MS.idle)
        break
      case 'approach':
        t = setTimeout(() => setPhase('lifting'), PHASE_MS.approach)
        break
      case 'lifting':
        t = setTimeout(() => setPhase('dragging'), PHASE_MS.lifting)
        break
      case 'dragging':
        t = setTimeout(() => setPhase('dropping'), PHASE_MS.dragging)
        break
      case 'dropping':
        // Card arrived — advance homeCol, then enter settled
        t = setTimeout(() => {
          setHomeCol((c) => (c + 1) % 4)
          setPhase('settled')
        }, PHASE_MS.dropping)
        break
      case 'settled':
        // Longer pause when landing on Done (col 3) so the viewer appreciates it
        t = setTimeout(() => {
          setPhase(homeCol === 3 ? 'resetting' : 'idle')
        }, homeCol === 3 ? 2400 : PHASE_MS.settled)
        break
      case 'resetting':
        t = setTimeout(() => {
          setHomeCol(0)
          setPhase('idle')
        }, PHASE_MS.resetting)
        break
    }

    return () => clearTimeout(t)
  }, [phase, homeCol])

  const nextCol = (homeCol + 1) % 4
  const isDragging = phase === 'dragging' || phase === 'dropping'

  // Initial positions for the overlay elements (col 0 at mount)
  const initPos = CARD_POSITIONS[0]

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', aspectRatio: `${BOARD_W} / ${BOARD_H}`, position: 'relative' }}
    >
      {/* ── Fixed-size inner canvas, scaled to container ── */}
      <div
        className="absolute inset-0 overflow-hidden rounded-xl border border-surface-border bg-surface shadow-2xl shadow-black/15"
        style={{
          width: BOARD_W,
          height: BOARD_H,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}
      >
        <BoardHeader />

        {/* ── Columns ── */}
        <div
          className="absolute flex"
          style={{ top: HEADER_H + PAD, left: PAD, bottom: PAD, right: PAD, gap: COL_GAP }}
        >
          {COLS.map((col, c) => {
            const slotOpacity = getSlotOpacity(c, homeCol, phase)
            const isGhost     = slotOpacity > 0 && slotOpacity < 0.5
            const highlighted = isDragging && c === nextCol
            const count       = 2 + (cardInCol(c, homeCol, phase) ? 1 : 0)  // 2 base + maybe traveler

            return (
              <div
                key={c}
                className={`flex-shrink-0 overflow-hidden rounded-xl border transition-colors duration-200 ${
                  highlighted
                    ? `${col.hlBorder} ${col.hlBg}`
                    : 'border-surface-border bg-surface-muted/40'
                }`}
                style={{ width: COL_W }}
              >
                {/* Column header */}
                <div
                  className="flex items-center gap-2 px-2 py-1.5"
                  style={{ height: COL_HEADER_H }}
                >
                  <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="flex-1 text-[12px] font-semibold text-text-primary">{col.name}</span>
                  <span className="flex h-4 min-w-4 items-center justify-center rounded bg-surface-muted px-1 text-[10px] font-semibold text-text-secondary">
                    {count}
                  </span>
                </div>

                {/* Column body */}
                <div
                  style={{
                    padding: COL_INNER_PAD,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: CARD_GAP,
                  }}
                >
                  {/* Two static base cards */}
                  {BASE_CARDS[c].map((card) => (
                    <Card key={card.key} card={card} />
                  ))}

                  {/* Traveler card slot — always in layout, opacity controlled */}
                  <motion.div
                    animate={{ opacity: slotOpacity }}
                    transition={{ duration: 0.18 }}
                    style={{ flexShrink: 0 }}
                  >
                    <Card card={TRAVELER} ghost={isGhost} />
                  </motion.div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Floating drag card (absolutely positioned overlay) ── */}
        <motion.div
          animate={getFloatingAnimate(phase, homeCol)}
          transition={getFloatingTransition(phase)}
          initial={{ x: initPos.x, y: initPos.y, opacity: 0, scale: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: CARD_W,
            pointerEvents: 'none',
            zIndex: 50,
          }}
        >
          <Card card={TRAVELER} dragging />
        </motion.div>

        {/* ── Cursor ── */}
        <motion.div
          animate={getCursorAnimate(phase, homeCol)}
          transition={getCursorTransition(phase)}
          initial={{ x: initPos.x + CUR_OX, y: initPos.y + CUR_OY, opacity: 0 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 60,
          }}
        >
          <svg
            width="22"
            height="26"
            viewBox="0 0 22 26"
            fill="none"
            style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.35))' }}
          >
            <path
              d="M2 2L2 20L7 16L10 23.5L13 22L10 14.5H18L2 2Z"
              fill="white"
              stroke="#222"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </div>
    </div>
  )
}
