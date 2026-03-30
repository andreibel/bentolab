import {useQuery} from '@tanstack/react-query'
import client from './client'
import {queryKeys} from './queryKeys'
import type {CreateEpicData, Epic, UpdateEpicData} from '@/types/epic'
import type {Issue, Page} from '@/types/issue'

export const epicsApi = {
  list: (boardId: string) =>
    client.get<Epic[]>('/api/epics', { params: { boardId } }).then((r) => r.data),

  get: (epicId: string) =>
    client.get<Epic>(`/api/epics/${epicId}`).then((r) => r.data),

  create: (data: CreateEpicData) =>
    client.post<Epic>('/api/epics', data).then((r) => r.data),

  update: (epicId: string, data: UpdateEpicData) =>
    client.patch<Epic>(`/api/epics/${epicId}`, data).then((r) => r.data),

  delete: (epicId: string) =>
    client.delete(`/api/epics/${epicId}`),

  issues: (epicId: string, page = 0, size = 50) =>
    client
      .get<Page<Issue>>(`/api/epics/${epicId}/issues`, { params: { page, size } })
      .then((r) => r.data),
}

export function useEpics(boardId: string) {
  return useQuery({
    queryKey: queryKeys.epics.list(boardId),
    queryFn: () => epicsApi.list(boardId),
    enabled: !!boardId,
  })
}
