export type IssueType     = 'EPIC' | 'STORY' | 'TASK' | 'BUG' | 'SUBTASK'
export type IssuePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type IssueSeverity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'TRIVIAL'

export interface ChecklistItem {
  id: string
  text: string
  checked: boolean
  assigneeId: string | null
  position: number
}

export interface Issue {
  id: string
  orgId: string
  boardId: string
  issueKey: string
  type: IssueType
  priority: IssuePriority
  severity: IssueSeverity | null
  title: string
  description: string | null
  columnId: string
  position: number
  reporterId: string
  assigneeId: string | null
  watcherIds: string[]
  startDate: string | null
  dueDate: string | null
  completedAt: string | null
  estimatedHours: number | null
  totalTimeSpent: number
  remainingHours: number | null
  storyPoints: number | null
  sprintId: string | null
  epicId: string | null
  parentIssueId: string | null
  labelIds: string[]
  components: string[]
  checklist: ChecklistItem[]
  commentCount: number
  reassignmentCount: number
  statusChangeCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}
