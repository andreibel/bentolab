export interface Org {
  id: string
  name: string
  slug: string
  domain: string | null
  logoUrl: string | null
  description: string | null
  plan: 'FREE' | 'PRO' | 'ENTERPRISE'
  ownerId: string
  isActive: boolean
  setupCompleted: boolean
  createdAt: string
}

export type OrgRole = 'ORG_MEMBER' | 'ORG_ADMIN' | 'ORG_OWNER'
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'

export interface OrgInvitation {
  id: string
  email: string | null
  orgRole: OrgRole
  status: InvitationStatus
  invitedBy: string
  expiresAt: string
  createdAt: string
  token: string
}

export interface InvitationPreview {
  orgId: string
  orgName: string
  orgSlug: string
  role: OrgRole
  isEmailProtected: boolean
  expiresAt: string
}

export interface AcceptInvitationResult {
  userId: string
  orgRole: OrgRole
  joinedAt: string
  orgId: string
  orgSlug: string
  orgName: string
}

export interface OrgMember {
  userId: string
  orgRole: OrgRole
  invitedBy: string | null
  joinedAt: string
}

export interface OrgListItem {
  id: string
  name: string
  slug: string
  domain: string | null
  logoUrl: string | null
  description: string | null
  plan: string
  settings: Record<string, unknown>
  ownerId: string
  isActive: boolean
  isDefault: boolean
  setupCompleted: boolean
  createdAt: string
  updatedAt: string
}
