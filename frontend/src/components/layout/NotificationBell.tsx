import {useEffect, useRef, useState} from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {useNavigate} from 'react-router-dom'
import {useAuthStore} from '@/stores/authStore'
import {
  AlertTriangle,
  ArrowRight,
  AtSign,
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  Flag,
  Loader2,
  Mail,
  MessageSquare,
  Play,
  Trophy,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import {notificationsApi} from '@/api/notifications'
import {queryKeys} from '@/api/queryKeys'
import {cn} from '@/utils/cn'
import type {Notification, NotificationType} from '@/types/notification'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function notifIcon(type: NotificationType) {
  switch (type) {
    case 'ISSUE_ASSIGNED':        return { Icon: UserPlus,      color: 'text-primary      bg-primary/10'      }
    case 'ISSUE_COMMENTED':       return { Icon: MessageSquare, color: 'text-accent        bg-accent/10'       }
    case 'ISSUE_MENTIONED':       return { Icon: AtSign,        color: 'text-accent        bg-accent/10'       }
    case 'ISSUE_STATUS_CHANGED':  return { Icon: ArrowRight,    color: 'text-text-secondary bg-surface-border' }
    case 'ISSUE_CLOSED':          return { Icon: CheckCircle2,  color: 'text-emerald-500   bg-emerald-500/10'  }
    case 'ISSUE_PRIORITY_CHANGED':return { Icon: AlertTriangle, color: 'text-red-500       bg-red-500/10'      }
    case 'SPRINT_STARTED':        return { Icon: Play,          color: 'text-primary       bg-primary/10'      }
    case 'SPRINT_COMPLETED':      return { Icon: Trophy,        color: 'text-amber-500     bg-amber-500/10'    }
    case 'SPRINT_DUE_SOON':       return { Icon: Clock,         color: 'text-red-500       bg-red-500/10'      }
    case 'BOARD_MEMBER_ADDED':    return { Icon: UserPlus,      color: 'text-emerald-500   bg-emerald-500/10'  }
    case 'BOARD_MEMBER_REMOVED':  return { Icon: UserMinus,     color: 'text-red-500       bg-red-500/10'      }
    case 'ORG_INVITATION':        return { Icon: Mail,          color: 'text-primary       bg-primary/10'      }
    case 'ORG_MEMBER_JOINED':     return { Icon: Users,         color: 'text-emerald-500   bg-emerald-500/10'  }
    case 'EPIC_COMPLETED':        return { Icon: Flag,          color: 'text-amber-500     bg-amber-500/10'    }
    default:                      return { Icon: Bell,          color: 'text-text-muted    bg-surface-border'  }
  }
}

function notifUrl(n: Notification): string | null {
  if (n.boardId && n.issueId) return `/boards/${n.boardId}?issue=${n.issueId}`
  if (n.boardId && n.sprintId) return `/boards/${n.boardId}/backlog`
  if (n.boardId) return `/boards/${n.boardId}`
  return null
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotifRow({
  notif,
  onRead,
}: {
  notif: Notification
  onRead: (n: Notification) => void
}) {
  const navigate   = useNavigate()
  const { Icon, color } = notifIcon(notif.type)
  const url        = notifUrl(notif)

  const handleClick = () => {
    onRead(notif)
    if (url) navigate(url)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-surface-muted/60',
        !notif.isRead && 'bg-primary/[0.03]',
      )}
    >
      {/* Icon */}
      <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm', color)}>
        <Icon className="h-4 w-4" />
      </span>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm leading-snug', notif.isRead ? 'text-text-secondary' : 'font-medium text-text-primary')}>
          {notif.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-text-muted">
          {notif.message}
        </p>
        <p className="mt-1 text-[11px] text-text-muted">{timeAgo(notif.createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!notif.isRead && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  )
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

function NotificationDrawer({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'all' | 'unread'>('all')

  const { data: page, isLoading } = useQuery({
    queryKey: queryKeys.notifications.list(tab === 'unread'),
    queryFn:  () => notificationsApi.list({ unreadOnly: tab === 'unread', size: 40 }),
  })

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list(true) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() })
    },
  })

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const handleRead = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.id)
    onClose()
  }

  const notifications = page?.content ?? []
  const hasUnread     = notifications.some((n) => !n.isRead)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
          {(page?.totalElements ?? 0) > 0 && (
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-text-muted">
              {page?.totalElements}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasUnread && (
            <button
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              title="Mark all as read"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary disabled:opacity-50"
            >
              {markAll.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <CheckCheck className="h-3.5 w-3.5" />
              }
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 gap-1 border-b border-surface-border px-4 pt-2">
        {(['all', 'unread'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-t-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
              tab === t
                ? 'border-b-2 border-primary text-primary'
                : 'text-text-muted hover:text-text-primary',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
              <Bell className="h-5 w-5 text-text-muted" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                {tab === 'unread' ? 'All caught up' : 'No notifications yet'}
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                {tab === 'unread' ? "You've read everything." : "We'll notify you when something happens."}
              </p>
            </div>
          </div>
        )}

        {!isLoading && notifications.length > 0 && (
          <div className="divide-y divide-surface-border/50">
            {notifications.map((n) => (
              <NotifRow key={n.id} notif={n} onRead={handleRead} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Real-time SSE hook ───────────────────────────────────────────────────────

function useNotificationStream(onNotification: () => void) {
  const accessToken  = useAuthStore((s) => s.accessToken)
  const baseUrl      = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
  const callbackRef  = useRef(onNotification)
  callbackRef.current = onNotification

  useEffect(() => {
    if (!accessToken) return

    let active = true
    const abortController = new AbortController()

    const connect = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/notifications/stream`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: abortController.signal,
        })

        if (!response.ok || !response.body) return

        const reader  = response.body.getReader()
        const decoder = new TextDecoder()

        while (active) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value, { stream: true })
          if (text.includes('notification')) {
            callbackRef.current()
          }
        }
      } catch {
        // connection closed or aborted — ignore
      }
    }

    void connect()

    return () => {
      active = false
      abortController.abort()
    }
  }, [accessToken, baseUrl])
}

// ─── Public: bell + drawer ────────────────────────────────────────────────────

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)
  const queryClient     = useQueryClient()

  useNotificationStream(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() })
  })

  const { data } = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn:  notificationsApi.unreadCount,
  })

  const count = data?.count ?? 0

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary',
          open && 'bg-surface-muted text-text-primary',
        )}
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute inset-e-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Drawer */}
      {open && (
        <div
          className={cn(
            'absolute end-0 top-full z-50 mt-2',
            'w-96 overflow-hidden rounded-xl border border-surface-border bg-surface shadow-xl shadow-black/10 dark:shadow-black/40',
            'flex max-h-[560px] flex-col',
            'animate-palette-in', // reuse existing fade-in keyframe
          )}
        >
          <NotificationDrawer onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
