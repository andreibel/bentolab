import type { QueryClient } from '@tanstack/react-query'

const MOCK_NOTIFICATIONS = [
  { id: '1', orgId: 'org1', userId: 'u1', type: 'ISSUE_ASSIGNED',         title: 'Issue assigned to you',             message: 'TF-42 · Implement JWT refresh token rotation was assigned to you by Alex Kim',    issueId: 'i1', issueKey: 'TF-42', boardId: 'b1', isRead: false, createdAt: new Date(Date.now() - 2 * 60_000).toISOString() },
  { id: '2', orgId: 'org1', userId: 'u1', type: 'ISSUE_MENTIONED',        title: 'You were mentioned in TF-38',        message: 'Sara Chen mentioned you in a comment: "@you can you check this edge case?"',        issueId: 'i2', issueKey: 'TF-38', boardId: 'b1', isRead: false, createdAt: new Date(Date.now() - 15 * 60_000).toISOString() },
  { id: '3', orgId: 'org1', userId: 'u1', type: 'ISSUE_COMMENTED',        title: 'New comment on TF-35',               message: 'Mike Ross commented on Fix due date picker clipping in sidebar',                  issueId: 'i3', issueKey: 'TF-35', boardId: 'b1', isRead: false, createdAt: new Date(Date.now() - 40 * 60_000).toISOString() },
  { id: '4', orgId: 'org1', userId: 'u1', type: 'ISSUE_PRIORITY_CHANGED', title: 'TF-29 priority changed to CRITICAL', message: 'Discord webhook integration was escalated from MEDIUM to CRITICAL',               issueId: 'i4', issueKey: 'TF-29', boardId: 'b1', isRead: false, createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString() },
  { id: '5', orgId: 'org1', userId: 'u1', type: 'SPRINT_STARTED',         title: 'Sprint started: Sprint 24',          message: 'Sprint 24 has started. Ends on ' + new Date(Date.now() + 13 * 86_400_000).toLocaleDateString(), sprintId: 's1', boardId: 'b1', isRead: true,  createdAt: new Date(Date.now() - 1 * 86_400_000).toISOString() },
  { id: '6', orgId: 'org1', userId: 'u1', type: 'ISSUE_STATUS_CHANGED',   title: 'TF-21 moved to In Review',           message: 'Board member role management was moved from In Progress to In Review',            issueId: 'i5', issueKey: 'TF-21', boardId: 'b1', isRead: true,  createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString() },
  { id: '7', orgId: 'org1', userId: 'u1', type: 'BOARD_MEMBER_ADDED',     title: 'You were added to Frontend & UI',    message: 'You now have access to board: Frontend & UI',                                    boardId: 'b2', isRead: true,  createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString() },
  { id: '8', orgId: 'org1', userId: 'u1', type: 'SPRINT_COMPLETED',       title: 'Sprint completed: Sprint 23',        message: '18 issues completed, 4 carried over',                                            sprintId: 's0', boardId: 'b1', isRead: true,  createdAt: new Date(Date.now() - 7 * 86_400_000).toISOString() },
]

export function registerDevHelpers(queryClient: QueryClient) {
  const win = window as unknown as Record<string, unknown>

  win.seedNotifications = () => {
    const unread = MOCK_NOTIFICATIONS.filter((n) => !n.isRead)
    queryClient.setQueryData(['notifications', 'list', undefined], {
      content: MOCK_NOTIFICATIONS,
      totalElements: MOCK_NOTIFICATIONS.length,
      totalPages: 1,
      number: 0,
    })
    queryClient.setQueryData(['notifications', 'list', true], {
      content: unread,
      totalElements: unread.length,
      totalPages: 1,
      number: 0,
    })
    queryClient.setQueryData(['notifications', 'unread-count'], { count: unread.length })
    console.log('%c✅ Notifications seeded', 'color: #5B47E0; font-weight: bold')
  }

  console.log('%c🔔 Dev tip: call seedNotifications() to populate the notification drawer', 'color: #5B47E0')
}
