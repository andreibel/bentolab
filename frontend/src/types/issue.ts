export interface IssueSearchResult {
  issueId:         string
  issueKey:        string
  title:           string
  boardId:         string
  priority:        string | null
  type:            string | null
  closed:          boolean
  assigneeId:      string | null
  reporterId:      string
  epicId:          string | null
  labelIds:        string[]
  startDate:       string | null
  dueDate:         string | null
  matchIn:         'TITLE' | 'DESCRIPTION' | 'COMMENT'
  snippet:         string
  commentAuthorId: string | null
}

export type IssueType     = 'STORY' | 'TASK' | 'BUG' | 'SUBTASK'
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
  closed: boolean
  closedAt: string | null
  estimatedHours: number | null
  totalTimeSpent: number
  remainingHours: number | null
  storyPoints: number | null
  sprintId: string | null
  epicId: string | null
  parentIssueId: string | null
  milestoneId: string | null
  dependencyIds: string[] | null
  labelIds: string[]
  components: string[]
  attachmentIds: string[]
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

export interface Comment {
  id: string
  issueId: string
  userId: string
  text: string
  mentionedUserIds: string[]
  isEdited: boolean
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: string
  userId: string
  entityType: string
  action: string
  details: Record<string, unknown>
  createdAt: string
}

export interface TimeLog {
  id: string
  issueId: string
  userId: string
  hoursSpent: number
  date: string
  description: string | null
  createdAt: string
}
