export interface OrgPermission {
  permissionKey: string
  label: string
  description: string
  locked: boolean
  allowedRoles: string[]
}

export interface BoardPermission {
  permissionKey: string
  label: string
  description: string
  locked: boolean
  allowedRoles: string[]
}

export const ORG_ROLES = ['ORG_MEMBER', 'ORG_ADMIN', 'ORG_OWNER'] as const
export type OrgRole = typeof ORG_ROLES[number]

export const BOARD_ROLES = ['VIEWER', 'DEVELOPER', 'SCRUM_MASTER', 'PRODUCT_OWNER'] as const
export type BoardRole = typeof BOARD_ROLES[number]

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  ORG_MEMBER: 'Member',
  ORG_ADMIN: 'Admin',
  ORG_OWNER: 'Owner',
}

export const BOARD_ROLE_LABELS: Record<BoardRole, string> = {
  VIEWER: 'Viewer',
  DEVELOPER: 'Developer',
  SCRUM_MASTER: 'Scrum Master',
  PRODUCT_OWNER: 'Product Owner',
}
