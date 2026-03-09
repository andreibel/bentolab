import client from './client'
import type { Org, OrgListItem } from '@/types/org'

export const orgsApi = {
  list: () =>
    client.get<OrgListItem[]>('/api/orgs').then((r) => r.data),

  create: (data: { name: string; slug: string; description?: string; logoUrl?: string }) =>
    client.post<Org>('/api/orgs', data).then((r) => r.data),

  get: (orgId: string) =>
    client.get<Org>(`/api/orgs/${orgId}`).then((r) => r.data),

  update: (orgId: string, data: Partial<{ name: string; description: string; logoUrl: string }>) =>
    client.patch<Org>(`/api/orgs/${orgId}`, data).then((r) => r.data),

}
