import {useQuery} from '@tanstack/react-query'
import client from './client'
import {queryKeys} from './queryKeys'
import type {CreateSprintData, Sprint, UpdateSprintData} from '@/types/sprint'

export const sprintsApi = {
  list: (boardId: string) =>
    client.get<Sprint[]>('/api/sprints', { params: { boardId } }).then((r) => r.data),

  get: (sprintId: string) =>
    client.get<Sprint>(`/api/sprints/${sprintId}`).then((r) => r.data),

  create: (data: CreateSprintData) =>
    client.post<Sprint>('/api/sprints', data).then((r) => r.data),

  update: (sprintId: string, data: UpdateSprintData) =>
    client.patch<Sprint>(`/api/sprints/${sprintId}`, data).then((r) => r.data),

  start: (sprintId: string) =>
    client.post<Sprint>(`/api/sprints/${sprintId}/start`).then((r) => r.data),

  complete: (sprintId: string, data: { moveIncompleteToSprintId?: string | null }) =>
    client.post<Sprint>(`/api/sprints/${sprintId}/complete`, data).then((r) => r.data),
}

export function useSprints(boardId: string) {
  return useQuery({
    queryKey: queryKeys.sprints.all(boardId),
    queryFn: () => sprintsApi.list(boardId),
    enabled: !!boardId,
  })
}
