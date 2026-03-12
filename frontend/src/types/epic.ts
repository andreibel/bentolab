export type EpicStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'

export interface Epic {
  id: string
  orgId: string
  boardId: string
  title: string
  description: string | null
  color: string
  status: EpicStatus
  startDate: string | null
  endDate: string | null
  ownerId: string
  issueCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateEpicData {
  boardId: string
  title: string
  description?: string
  color?: string
  startDate?: string
  endDate?: string
}

export interface UpdateEpicData {
  title?: string
  description?: string
  color?: string
  status?: EpicStatus
  startDate?: string | null
  endDate?: string | null
}
