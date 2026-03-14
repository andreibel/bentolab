import {useQuery} from '@tanstack/react-query'
import client from './client'
import {queryKeys} from './queryKeys'
import type {Activity, Comment, Issue, Page, TimeLog} from '@/types/issue'

export const issuesApi = {
  list: (boardId: string, page = 0, size = 200, closed?: boolean) =>
    client
      .get<Page<Issue>>('/api/issues', { params: { boardId, page, size, ...(closed !== undefined ? { closed } : {}) } })
      .then((r) => r.data),

  get: (issueId: string) =>
    client.get<Issue>(`/api/issues/${issueId}`).then((r) => r.data),

  create: (data: Partial<Issue> & { boardId: string; boardKey: string; title: string }) =>
    client.post<Issue>('/api/issues', data).then((r) => r.data),

  update: (issueId: string, data: Partial<Issue>) =>
    client.patch<Issue>(`/api/issues/${issueId}`, data).then((r) => r.data),

  move: (issueId: string, columnId: string, position: number) =>
    client
      .patch<Issue>(`/api/issues/${issueId}/move`, { columnId, position })
      .then((r) => r.data),

  delete: (issueId: string) => client.delete(`/api/issues/${issueId}`),

  assign: (issueId: string, assigneeId: string | null) =>
    client.patch<Issue>(`/api/issues/${issueId}/assign`, { assigneeId }).then((r) => r.data),

  mine: (relation: 'all' | 'assigned' | 'created' = 'all', closed?: boolean) =>
    client
      .get<Page<Issue>>('/api/issues/mine', {
        params: { relation, size: 200, ...(closed !== undefined ? { closed } : {}) },
      })
      .then((r) => r.data),

  close: (issueId: string) =>
    client.patch<Issue>(`/api/issues/${issueId}/close`).then((r) => r.data),

  reopen: (issueId: string) =>
    client.patch<Issue>(`/api/issues/${issueId}/reopen`).then((r) => r.data),

  // ── Comments ────────────────────────────────────────────────────────────────
  comments: {
    list: (issueId: string) =>
      client
        .get<Page<Comment>>(`/api/issues/${issueId}/comments`, { params: { size: 100 } })
        .then((r) => r.data),

    create: (issueId: string, text: string) =>
      client.post<Comment>(`/api/issues/${issueId}/comments`, { text }).then((r) => r.data),

    update: (issueId: string, commentId: string, text: string) =>
      client
        .patch<Comment>(`/api/issues/${issueId}/comments/${commentId}`, { text })
        .then((r) => r.data),

    delete: (issueId: string, commentId: string) =>
      client.delete(`/api/issues/${issueId}/comments/${commentId}`),
  },

  // ── Activity ────────────────────────────────────────────────────────────────
  activities: {
    list: (issueId: string) =>
      client
        .get<Page<Activity>>(`/api/issues/${issueId}/activities`, { params: { size: 50 } })
        .then((r) => r.data),
  },

  // ── Time logs ───────────────────────────────────────────────────────────────
  timelogs: {
    list: (issueId: string) =>
      client.get<TimeLog[]>(`/api/issues/${issueId}/timelogs`).then((r) => r.data),

    create: (issueId: string, data: { hoursSpent: number; date: string; description?: string }) =>
      client.post<TimeLog>(`/api/issues/${issueId}/timelogs`, data).then((r) => r.data),

    delete: (issueId: string, timeLogId: string) =>
      client.delete(`/api/issues/${issueId}/timelogs/${timeLogId}`),
  },
}

export function useIssues(boardId: string, closed?: boolean) {
  return useQuery({
    queryKey: queryKeys.issues.list(boardId, undefined, closed),
    queryFn: () => issuesApi.list(boardId, 0, 200, closed),
    enabled: !!boardId,
  })
}
