import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Paperclip, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { attachmentsApi } from '@/api/attachments'
import { queryKeys } from '@/api/queryKeys'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useAuthStore } from '@/stores/authStore'
import type { Attachment } from '@/types/attachment'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function fileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return '🖼️'
  if (contentType === 'application/pdf') return '📄'
  if (contentType.includes('zip') || contentType.includes('tar')) return '📦'
  return '📎'
}

// ─── Image preview modal ──────────────────────────────────────────────────────

function ImagePreview({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div className="relative max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -right-3 -top-3 z-10 rounded-full bg-surface p-1 shadow-lg hover:bg-surface-muted"
        >
          <X className="h-4 w-4 text-text-primary" />
        </button>
        <img
          src={src}
          alt={name}
          className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
        />
        <p className="mt-2 text-center text-xs text-white/70">{name}</p>
      </div>
    </div>
  )
}

// ─── Attachment row ───────────────────────────────────────────────────────────

function AttachmentRow({
  attachment,
  canDelete,
  onDelete,
}: {
  attachment: Attachment
  canDelete: boolean
  onDelete: () => void
}) {
  const [downloading, setDownloading] = useState(false)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const isImage = attachment.contentType.startsWith('image/')

  const fetchUrl = async () => {
    const url = await attachmentsApi.getDownloadUrl(attachment.id)
    return url
  }

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      const url = await fetchUrl()
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.fileName
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      toast.error('Failed to get download link')
    } finally {
      setDownloading(false)
    }
  }

  const handlePreview = async () => {
    try {
      const url = await fetchUrl()
      setPreviewSrc(url)
    } catch {
      toast.error('Failed to load preview')
    }
  }

  return (
    <>
      <div className="group flex items-center gap-3 rounded-lg border border-surface-border bg-surface-muted/30 px-3 py-2.5 transition-colors hover:bg-surface-muted/60">
        {/* Icon / thumbnail trigger */}
        <button
          onClick={isImage ? handlePreview : undefined}
          className={isImage ? 'shrink-0 cursor-pointer' : 'shrink-0 cursor-default'}
          tabIndex={isImage ? 0 : -1}
          title={isImage ? 'Preview' : undefined}
        >
          <span className="text-lg leading-none">{fileIcon(attachment.contentType)}</span>
        </button>

        <div className="min-w-0 flex-1">
          <button
            onClick={isImage ? handlePreview : handleDownload}
            className="block truncate text-sm font-medium text-text-primary hover:text-primary hover:underline"
          >
            {attachment.fileName}
          </button>
          <p className="text-xs text-text-muted">
            {fmtSize(attachment.size)} · {fmtDate(attachment.createdAt)}
          </p>
        </div>

        {/* Download button — always visible */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="rounded p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary disabled:opacity-50"
          title="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </button>

        {canDelete && (
          <button
            onClick={onDelete}
            className="rounded p-1.5 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
            title="Delete attachment"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {previewSrc && (
        <ImagePreview src={previewSrc} name={attachment.fileName} onClose={() => setPreviewSrc(null)} />
      )}
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function IssueAttachments({ issueId, orgId }: { issueId: string; orgId: string }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: queryKeys.attachments.list('ISSUE', issueId),
    queryFn: () => attachmentsApi.list('ISSUE', issueId),
    enabled: !!issueId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => attachmentsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.attachments.list('ISSUE', issueId) })
      toast.success('Attachment deleted')
    },
    onError: () => toast.error('Failed to delete attachment'),
  })

  const { uploading, progress, upload } = useFileUpload({
    entityType: 'ISSUE',
    entityId: issueId,
    orgId,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.attachments.list('ISSUE', issueId) })
      toast.success('File uploaded')
    },
    onError: (err) => toast.error(err.message),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void upload(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) void upload(file)
  }

  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Attachments{attachments.length > 0 ? ` · ${attachments.length}` : ''}
        </h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Upload progress bar */}
      {uploading && (
        <div className="mb-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-1 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Drop zone (shown when empty) */}
      {!isLoading && attachments.length === 0 && !uploading && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-surface-border px-4 py-6 text-center transition-colors hover:border-primary/40 hover:bg-surface-muted/30"
        >
          <Paperclip className="h-5 w-5 text-text-muted" />
          <p className="text-xs text-text-muted">Drop a file here or click to upload</p>
        </div>
      )}

      {/* File list */}
      {attachments.length > 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col gap-1.5"
        >
          {attachments.map((a) => (
            <AttachmentRow
              key={a.id}
              attachment={a}
              canDelete={a.uploadedBy === user?.id}
              onDelete={() => deleteMutation.mutate(a.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}