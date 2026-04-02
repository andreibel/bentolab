import { useState } from 'react'
import { attachmentsApi } from '@/api/attachments'
import type { Attachment, EntityType } from '@/types/attachment'

interface UploadOptions {
  entityType: EntityType
  entityId: string
  orgId: string
  onSuccess?: (attachment: Attachment) => void
  onError?: (error: Error) => void
}

interface UploadState {
  uploading: boolean
  progress: number  // 0-100, rough estimate
  error: string | null
}

export function useFileUpload({ entityType, entityId, orgId, onSuccess, onError }: UploadOptions) {
  const [state, setState] = useState<UploadState>({ uploading: false, progress: 0, error: null })

  const upload = async (file: File) => {
    setState({ uploading: true, progress: 10, error: null })
    try {
      // Step 1: get presigned URL
      const { attachmentId, uploadUrl } = await attachmentsApi.presign({
        entityType,
        entityId,
        orgId,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
      })

      setState((s) => ({ ...s, progress: 40 }))

      // Step 2: upload directly to S3
      await attachmentsApi.uploadToS3(uploadUrl, file)

      setState((s) => ({ ...s, progress: 80 }))

      // Step 3: confirm
      const attachment = await attachmentsApi.confirm(attachmentId)

      setState({ uploading: false, progress: 100, error: null })
      onSuccess?.(attachment)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed')
      setState({ uploading: false, progress: 0, error: error.message })
      onError?.(error)
    }
  }

  return { ...state, upload }
}