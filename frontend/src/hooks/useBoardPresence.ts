import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { stompManager } from '@/lib/stomp'
import { useStompSubscription } from './useStompSubscription'

export interface PresenceUser {
  userId: string
  displayName: string
  avatarUrl: string | null
}

/**
 * Tracks active viewers on a board (Google Docs–style presence).
 *
 * - Sends a join message when mounted, a leave message when unmounted.
 * - Subscribes to /topic/board/{boardId}/presence for updates from the backend.
 * - Returns the list of ALL presence users (including the current user).
 *   Use `userId` to filter out yourself in the UI.
 */
export function useBoardPresence(boardId: string): PresenceUser[] {
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([])
  const user = useAuthStore(s => s.user)
  const accessToken = useAuthStore(s => s.accessToken)

  // Announce join on mount, leave on unmount.
  // If the STOMP client isn't connected yet, the join is queued and flushed
  // automatically when the connection establishes.
  useEffect(() => {
    if (!user || !accessToken) return

    const payload: PresenceUser = {
      userId: user.id,
      displayName: `${user.firstName} ${user.lastName}`.trim(),
      avatarUrl: user.avatarUrl,
    }

    stompManager.send(`/app/presence/board/${boardId}/join`, payload)

    return () => {
      stompManager.send(`/app/presence/board/${boardId}/leave`, {})
    }
  }, [boardId, user, accessToken])

  // Listen for presence updates
  useStompSubscription(
    `/topic/board/${boardId}/presence`,
    (body) => {
      if (Array.isArray(body)) {
        setPresenceUsers(body as PresenceUser[])
      }
    },
  )

  return presenceUsers
}
