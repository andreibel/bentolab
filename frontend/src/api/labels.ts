import client from './client'

export interface Label {
  id: string
  orgId: string
  name: string
  color: string
  description: string | null
  createdAt: string
}

export const labelsApi = {
  list: () =>
    client.get<Label[]>('/api/labels').then((r) => r.data),

  create: (data: { name: string; color: string; description?: string }) =>
    client.post<Label>('/api/labels', data).then((r) => r.data),

  update: (labelId: string, data: { name?: string; color?: string; description?: string }) =>
    client.patch<Label>(`/api/labels/${labelId}`, data).then((r) => r.data),

  delete: (labelId: string) =>
    client.delete(`/api/labels/${labelId}`).then(() => undefined),
}
