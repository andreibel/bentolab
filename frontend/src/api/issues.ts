import { useQuery } from '@tanstack/react-query'
import client from './client'
import { queryKeys } from './queryKeys'
import type { Issue, Comment, Activity, Page } from '@/types/issue'

export const issuesApi = {
  list: (boardId: string, page = 0, size = 200) =>
    client
      .get<Page<Issue>>('/api/issues', { params: { boardId, page, size } })
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
}

export function useIssues(boardId: string) {
  return useQuery({
    queryKey: queryKeys.issues.list(boardId),
    queryFn: () => issuesApi.list(boardId),
    enabled: !!boardId,
  })
}
