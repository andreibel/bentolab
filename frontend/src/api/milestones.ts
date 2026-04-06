import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from './client'
import { queryKeys } from './queryKeys'
import type { Milestone, MilestoneStatus } from '@/types/milestone'

export const milestonesApi = {
  list: (boardId: string) =>
    client.get<Milestone[]>('/api/milestones', { params: { boardId } }).then((r) => r.data),

  get: (milestoneId: string) =>
    client.get<Milestone>(`/api/milestones/${milestoneId}`).then((r) => r.data),

  create: (data: { boardId: string; title: string; description?: string; date: string; color?: string }) =>
    client.post<Milestone>('/api/milestones', data).then((r) => r.data),

  update: (
    milestoneId: string,
    data: Partial<{ title: string; description: string; date: string; color: string; status: MilestoneStatus }>,
  ) => client.patch<Milestone>(`/api/milestones/${milestoneId}`, data).then((r) => r.data),

  delete: (milestoneId: string) => client.delete(`/api/milestones/${milestoneId}`),
}

export function useMilestones(boardId: string) {
  return useQuery({
    queryKey: queryKeys.milestones.list(boardId),
    queryFn: () => milestonesApi.list(boardId),
    enabled: !!boardId,
  })
}

export function useCreateMilestone(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: milestonesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.milestones.list(boardId) }),
  })
}

export function useUpdateMilestone(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof milestonesApi.update>[1] }) =>
      milestonesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.milestones.list(boardId) }),
  })
}

export function useDeleteMilestone(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: milestonesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.milestones.list(boardId) }),
  })
}
