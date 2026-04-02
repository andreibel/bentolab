import client from './client'
import type { Attachment, EntityType, PresignResponse } from '@/types/attachment'

export const attachmentsApi = {
  presign: (data: {
    entityType: EntityType
    entityId: string
    orgId: string
    fileName: string
    contentType: string
    size: number
  }) => client.post<PresignResponse>('/api/attachments/presign', data).then((r) => r.data),

  confirm: (attachmentId: string) =>
    client.post<Attachment>(`/api/attachments/${attachmentId}/confirm`).then((r) => r.data),

  list: (entityType: EntityType, entityId: string) =>
    client
      .get<Attachment[]>('/api/attachments', { params: { entityType, entityId } })
      .then((r) => r.data),

  getDownloadUrl: (attachmentId: string) =>
    client
      .get<{ url: string }>(`/api/attachments/${attachmentId}/download-url`)
      .then((r) => r.data.url),

  delete: (attachmentId: string) =>
    client.delete(`/api/attachments/${attachmentId}`),

  /** Upload a file directly to S3 using a presigned URL (bypasses the gateway). */
  uploadToS3: (uploadUrl: string, file: File) =>
    fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    }).then((res) => {
      if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`)
    }),
}