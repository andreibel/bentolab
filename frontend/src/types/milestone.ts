export type MilestoneStatus = 'PLANNED' | 'REACHED' | 'MISSED'

export interface Milestone {
  id: string
  orgId: string
  boardId: string
  title: string
  description: string | null
  date: string
  color: string
  status: MilestoneStatus
  createdBy: string
  createdAt: string
  updatedAt: string
}
