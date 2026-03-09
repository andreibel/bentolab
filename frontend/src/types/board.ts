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
