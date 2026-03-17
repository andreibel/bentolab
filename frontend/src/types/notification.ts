export type NotificationType =
  | 'EMAIL_VERIFICATION'
  | 'PASSWORD_RESET'
  | 'ORG_INVITATION'
  | 'ORG_MEMBER_JOINED'
  | 'BOARD_MEMBER_ADDED'
  | 'BOARD_MEMBER_REMOVED'
  | 'ISSUE_ASSIGNED'
  | 'ISSUE_COMMENTED'
  | 'ISSUE_MENTIONED'
  | 'ISSUE_STATUS_CHANGED'
  | 'ISSUE_CLOSED'
  | 'ISSUE_PRIORITY_CHANGED'
  | 'SPRINT_STARTED'
  | 'SPRINT_COMPLETED'
  | 'SPRINT_DUE_SOON'
  | 'EPIC_COMPLETED'

export interface Notification {
  id: string
  orgId: string
  userId: string
  type: NotificationType
  title: string
  message: string
  issueId?: string
  issueKey?: string
  boardId?: string
  sprintId?: string
  triggeredBy?: string
  isRead: boolean
  readAt?: string
  createdAt: string
}

export interface NotificationPage {
  content: Notification[]
  totalElements: number
  totalPages: number
  number: number
}

export interface UnreadCount {
  count: number
}
