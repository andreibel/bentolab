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

export interface OrgListItem {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  plan: string
  role: string
  isDefault: boolean
  createdAt: string
}
