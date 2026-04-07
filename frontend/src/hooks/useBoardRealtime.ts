import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { queryKeys } from '@/api/queryKeys'
import { useStompSubscription } from './useStompSubscription'
import type { Issue } from '@/types/issue'
import type { BoardColumn } from '@/types/board'

interface IssueEvent {
  eventType: string
  issueId: string
  boardId: string
  changedByUserId?: string
  createdByUserId?: string
  // IssueStatusChangedEvent fields
  toColumnName?: string
}

/**
 * Subscribes to real-time issue events for a board.
 *
 * - When another user moves an issue (IssueStatusChangedEvent), the board
 *   updates immediately by patching the React Query cache and then
 *   invalidating for a background consistency refetch.
 * - All other issue events (assigned, commented, priority, closed) trigger
 *   a query invalidation so the board reflects the latest data.
 *
 * Events from the current user are still processed so the cache stays
 * consistent across tabs/devices.
 */
export function useBoardRealtime(
  boardId: string,
  columns: BoardColumn[],
  issueOnBoard?: boolean,
  issueSprintId?: string,
) {
  const queryClient = useQueryClient()
  const currentUserId = useAuthStore(s => s.user?.id)

  // Must match the exact key useIssues() subscribes to in BoardPage
  const issueListKey = queryKeys.issues.list(boardId, undefined, false, issueOnBoard, issueSprintId)

  useStompSubscription(
    `/topic/board/${boardId}/issues`,
    (body) => {
      const event = body as IssueEvent
      if (!event?.eventType) return

      if (event.eventType === 'IssueCreatedEvent') {
        void queryClient.invalidateQueries({
          queryKey: issueListKey,
          refetchType: 'active',
        })
        return
      }

      if (event.eventType === 'IssueStatusChangedEvent' && event.toColumnName) {
        const targetCol = columns.find(c => c.name === event.toColumnName)

        if (targetCol) {
          // Optimistic patch: move the issue to the new column in the cache
          // (only for events from other users; own events are already applied)
          if (event.changedByUserId !== currentUserId) {
            queryClient.setQueryData(
              issueListKey,
              (old: { content: Issue[] } | undefined) => {
                if (!old) return old
                return {
                  ...old,
                  content: old.content.map(issue =>
                    issue.id === event.issueId
                      ? { ...issue, columnId: targetCol.id }
                      : issue,
                  ),
                }
              },
            )
          }
        }

        // Background refetch to confirm server state regardless
        void queryClient.invalidateQueries({
          queryKey: issueListKey,
          refetchType: event.changedByUserId === currentUserId ? 'none' : 'active',
        })
        return
      }

      // All other events: invalidate so data stays fresh
      void queryClient.invalidateQueries({
        queryKey: issueListKey,
        refetchType: 'active',
      })
    },
  )
}
