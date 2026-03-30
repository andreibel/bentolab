export type BoardType = 'SCRUM' | 'KANBAN' | 'BUG_TRACKING' | 'CUSTOM'

export interface Board {
  id: string
  orgId: string
  name: string
  description: string | null
  boardKey: string
  boardType: BoardType
  background: string | null
  ownerId: string
  isArchived: boolean
  issueCounter: number
  createdAt: string
  updatedAt: string
}

export type BoardRole = 'PRODUCT_OWNER' | 'SCRUM_MASTER' | 'DEVELOPER' | 'VIEWER'

export interface BoardMember {
  id: string
  boardId: string
  userId: string
  boardRole: BoardRole
  joinedAt: string
  addedBy: string | null
}

export interface UserProfile {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
}

export interface BoardMemberWithProfile extends BoardMember {
  profile: UserProfile | null
}

export interface BoardColumn {
  id: string
  boardId: string
  name: string
  position: number
  color: string | null
  wipLimit: number | null
  isInitial: boolean
  isFinal: boolean
  createdAt: string
}
