export type EntityType = 'ISSUE' | 'COMMENT' | 'USER_AVATAR' | 'ORG_LOGO'
export type AttachmentStatus = 'PENDING' | 'CONFIRMED' | 'DELETED'

export interface Attachment {
  id: string
  entityType: EntityType
  entityId: string
  orgId: string
  fileName: string
  contentType: string
  size: number
  status: AttachmentStatus
  uploadedBy: string
  downloadUrl: string | null
  createdAt: string
}

export interface PresignResponse {
  attachmentId: string
  uploadUrl: string
  expiresInMinutes: number
}
