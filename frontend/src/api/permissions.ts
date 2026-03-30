import client from './client'
import type {BoardPermission, OrgPermission} from '@/types/permissions'

export const permissionsApi = {
  getOrgPermissions: (orgId: string) =>
    client.get<OrgPermission[]>(`/api/orgs/${orgId}/permissions`).then((r) => r.data),

  updateOrgPermission: (orgId: string, key: string, allowedRoles: string[]) =>
    client
      .put<OrgPermission>(`/api/orgs/${orgId}/permissions/${key}`, { allowedRoles })
      .then((r) => r.data),

  getBoardPermissions: (boardId: string) =>
    client.get<BoardPermission[]>(`/api/boards/${boardId}/permissions`).then((r) => r.data),

  updateBoardPermission: (boardId: string, key: string, allowedRoles: string[]) =>
    client
      .put<BoardPermission>(`/api/boards/${boardId}/permissions/${key}`, { allowedRoles })
      .then((r) => r.data),
}
