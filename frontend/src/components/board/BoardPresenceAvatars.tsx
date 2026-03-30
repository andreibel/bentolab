import * as Tooltip from '@radix-ui/react-tooltip'
import { cn } from '@/utils/cn'
import type { PresenceUser } from '@/hooks/useBoardPresence'

const MAX_VISIBLE = 5

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

// Deterministic color from userId so each user gets a consistent color
const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-red-500',
  'bg-amber-500',
]
function colorFor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function Avatar({ user, size = 28 }: { user: PresenceUser; size?: number }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full ring-2 ring-surface text-white',
        !user.avatarUrl && colorFor(user.userId),
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.displayName}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span className="font-semibold leading-none">{initials(user.displayName)}</span>
      )}
    </div>
  )
}

interface Props {
  users: PresenceUser[]
  currentUserId: string | undefined
}

/**
 * Displays overlapping avatar bubbles for users currently viewing the board.
 * Shows up to MAX_VISIBLE avatars, then a "+N" overflow indicator.
 * The current user is excluded from the display.
 */
export function BoardPresenceAvatars({ users, currentUserId }: Props) {
  const others = users.filter(u => u.userId !== currentUserId)
  if (others.length === 0) return null

  const visible = others.slice(0, MAX_VISIBLE)
  const overflow = others.length - MAX_VISIBLE

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="flex items-center" style={{ gap: 0 }}>
        {visible.map((user, i) => (
          <Tooltip.Root key={user.userId}>
            <Tooltip.Trigger asChild>
              <div
                className="cursor-default transition-transform hover:z-10 hover:-translate-y-0.5"
                style={{ marginLeft: i === 0 ? 0 : -8, zIndex: i }}
              >
                <Avatar user={user} />
              </div>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="bottom"
                sideOffset={6}
                className="rounded-md bg-text-primary px-2 py-1 text-xs text-surface shadow-sm"
              >
                {user.displayName}
                <Tooltip.Arrow className="fill-text-primary" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}

        {overflow > 0 && (
          <div
            className="flex shrink-0 items-center justify-center rounded-full bg-surface-muted ring-2 ring-surface text-xs font-semibold text-text-secondary"
            style={{ width: 28, height: 28, marginLeft: -8 }}
          >
            +{overflow}
          </div>
        )}
      </div>
    </Tooltip.Provider>
  )
}
