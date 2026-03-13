export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'],
  },
  orgs: {
    all:     ()           => ['orgs'],
    detail:  (id: string) => ['orgs', id],
    members: (id: string) => ['orgs', id, 'members'],
  },
  boards: {
    all:     (orgId: string)   => ['boards', orgId],
    detail:  (boardId: string) => ['boards', boardId],
    columns: (boardId: string) => ['boards', boardId, 'columns'],
    members: (boardId: string) => ['boards', boardId, 'members'],
    labels:  (boardId: string) => ['boards', boardId, 'labels'],
  },
  issues: {
    list:       (boardId: string, page?: number, closed?: boolean) => ['issues', boardId, page, closed],
    detail:     (issueId: string)                => ['issues', 'detail', issueId],
    comments:   (issueId: string)                => ['issues', issueId, 'comments'],
    timelogs:   (issueId: string)                => ['issues', issueId, 'timelogs'],
    relations:  (issueId: string)                => ['issues', issueId, 'relations'],
    activities: (issueId: string)                => ['issues', issueId, 'activities'],
    filters:    (boardId: string)                => ['issues', 'filters', boardId],
  },

  sprints: {
    all:    (boardId: string)  => ['sprints', boardId],
    detail: (sprintId: string) => ['sprints', sprintId],
  },
  permissions: {
    org:   (orgId: string)   => ['permissions', 'org', orgId],
    board: (boardId: string) => ['permissions', 'board', boardId],
  },
  epics: {
    list:   (boardId: string) => ['epics', boardId],
    detail: (epicId: string)  => ['epics', 'detail', epicId],
  },
}
