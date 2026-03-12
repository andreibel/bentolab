import { cn } from '@/utils/cn'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg'

const SIZE: Record<AvatarSize, string> = {
  xs: 'h-4 w-4 text-[8px]',
  sm: 'h-5 w-5 text-[9px]',
  md: 'h-7 w-7 text-[10px]',
  lg: 'h-8 w-8 text-xs',
}

interface AvatarProps {
  /** User ID or any string — first 2 chars used as initials */
  userId?: string | null
  /** Full name — used to derive initials if provided */
  name?: string | null
  size?: AvatarSize
  className?: string
}

export function Avatar({ userId, name, size = 'sm', className }: AvatarProps) {
  if (!userId && !name) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full border border-dashed border-surface-border text-text-muted',
          SIZE[size],
          className,
        )}
      >
        ?
      </div>
    )
  }

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : (userId ?? '').slice(0, 2).toUpperCase()

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary-subtle font-bold text-primary ring-1 ring-surface-border',
        SIZE[size],
        className,
      )}
    >
      {initials}
    </div>
  )
}
