export type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED'

export interface Sprint {
  id: string
  orgId: string
  boardId: string
  name: string
  goal: string | null
  status: SprintStatus
  startDate: string | null
  endDate: string | null
  duration: number
  totalPoints: number
  completedPoints: number
  totalIssues: number
  completedIssues: number
  velocity: number | null
  createdBy: string
  createdAt: string
  completedAt: string | null
}

export interface CreateSprintData {
  boardId: string
  name: string
  goal?: string
  startDate: string
  endDate: string
}

export interface UpdateSprintData {
  name?: string
  goal?: string
  startDate?: string
  endDate?: string
}
