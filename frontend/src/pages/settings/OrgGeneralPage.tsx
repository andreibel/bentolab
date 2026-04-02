import {useCallback, useRef, useState} from 'react'
import Cropper from 'react-easy-crop'
import type {Area} from 'react-easy-crop'
import {Building2, Camera, Loader2, Minus, Plus, X, ZoomIn} from 'lucide-react'
import {toast} from 'sonner'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {attachmentsApi} from '@/api/attachments'
import {orgsApi} from '@/api/orgs'
import {queryKeys} from '@/api/queryKeys'
import {useAuthStore} from '@/stores/authStore'
import {cn} from '@/utils/cn'

// ── Crop helper ───────────────────────────────────────────────────────────────

async function getCroppedBlob(imageSrc: string, pixelCrop: Area, outputSize = 256): Promise<Blob> {
  const img = new Image()
  img.src = imageSrc
  await new Promise<void>((res, rej) => {
    img.onload = () => res()
    img.onerror = () => rej(new Error('Image load failed'))
  })
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, outputSize, outputSize)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => { if (blob) resolve(blob); else reject(new Error('Canvas export failed')) },
      'image/jpeg',
      0.88,
    )
  })
}

// ── Crop modal ────────────────────────────────────────────────────────────────

function CropModal({ imageSrc, onApply, onCancel }: { imageSrc: string; onApply: (blob: Blob) => void; onCancel: () => void }) {
  const [crop, setCrop]   = useState({ x: 0, y: 0 })
  const [zoom, setZoom]   = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [applying, setApplying] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => setCroppedAreaPixels(pixels), [])

  async function handleApply() {
    if (!croppedAreaPixels) return
    setApplying(true)
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      onApply(blob)
    } catch {
      toast.error('Failed to crop image')
      setApplying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 flex w-full max-w-md flex-col rounded-2xl border border-surface-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <h2 className="text-sm font-semibold text-text-primary">Crop logo</h2>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative h-80 w-full overflow-hidden bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            minZoom={1}
            maxZoom={4}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { background: '#000' },
              cropAreaStyle: { border: '2px solid rgba(91,71,224,0.8)', boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)' },
            }}
          />
        </div>
        <div className="border-t border-surface-border px-5 py-4">
          <div className="flex items-center gap-3">
            <ZoomIn className="h-3.5 w-3.5 shrink-0 text-text-muted" />
            <span className="w-10 shrink-0 text-xs tabular-nums text-text-muted">{zoom.toFixed(1)}×</span>
            <input
              type="range" min={1} max={4} step={0.05} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-surface-border accent-primary"
            />
            <button onClick={() => setZoom((z) => Math.max(1, z - 0.25))} className="rounded p-1 text-text-muted hover:text-text-primary"><Minus className="h-3.5 w-3.5" /></button>
            <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} className="rounded p-1 text-text-muted hover:text-text-primary"><Plus className="h-3.5 w-3.5" /></button>
          </div>
          <p className="mt-2 text-center text-[11px] text-text-muted">Drag to reposition · scroll or use slider to zoom</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-surface-border px-5 py-3">
          <button onClick={onCancel} className="h-8 rounded-lg border border-surface-border px-4 text-sm text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary">
            Cancel
          </button>
          <button onClick={handleApply} disabled={applying} className="flex h-8 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-60">
            {applying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrgGeneralPage() {
  const { currentOrgId } = useAuthStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: org } = useQuery({
    queryKey: queryKeys.orgs.detail(currentOrgId!),
    queryFn: () => orgsApi.get(currentOrgId!),
    enabled: !!currentOrgId,
  })

  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')

  // Sync form fields when org data loads
  const [synced, setSynced] = useState(false)
  if (org && !synced) {
    setName(org.name)
    setDescription(org.description ?? '')
    setLogoPreview(org.logoUrl ?? null)
    setSynced(true)
  }

  const updateMutation = useMutation({
    mutationFn: (data: Partial<{ name: string; description: string; logoUrl: string }>) =>
      orgsApi.update(currentOrgId!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orgs.all() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.orgs.detail(currentOrgId!) })
      toast.success('Organization updated')
    },
    onError: () => toast.error('Failed to update organization'),
  })

  // ── Logo upload ─────────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 20 * 1024 * 1024) { toast.error('Image must be smaller than 20 MB'); return }
    setCropSrc(URL.createObjectURL(file))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  async function handleCropApply(blob: Blob) {
    if (!currentOrgId) return
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)

    const file = new File([blob], 'logo.jpg', { type: 'image/jpeg' })
    setUploadingLogo(true)
    try {
      const { attachmentId, uploadUrl } = await attachmentsApi.presign({
        entityType:  'ORG_LOGO',
        entityId:    currentOrgId,
        orgId:       currentOrgId,
        fileName:    'logo.jpg',
        contentType: 'image/jpeg',
        size:        file.size,
      })
      await attachmentsApi.uploadToS3(uploadUrl, file)
      await attachmentsApi.confirm(attachmentId)
      const downloadUrl = await attachmentsApi.getDownloadUrl(attachmentId)
      await updateMutation.mutateAsync({ logoUrl: downloadUrl })
      setLogoPreview(downloadUrl)
    } catch {
      toast.error('Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleRemoveLogo() {
    setUploadingLogo(true)
    try {
      await updateMutation.mutateAsync({ logoUrl: '' })
      setLogoPreview(null)
    } finally {
      setUploadingLogo(false)
    }
  }

  // ── Save name / description ─────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await updateMutation.mutateAsync({ name: name.trim(), description: description.trim() })
  }

  const initials = (org?.name ?? '').slice(0, 2).toUpperCase()
  const infoChanged = name.trim() !== (org?.name ?? '') || description.trim() !== (org?.description ?? '')

  return (
    <>
      {cropSrc && <CropModal imageSrc={cropSrc} onApply={handleCropApply} onCancel={handleCropCancel} />}

      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">General</h1>
            <p className="text-sm text-text-muted">Manage your organization's name, logo, and description.</p>
          </div>
        </div>

        {/* Logo section */}
        <section className="mb-8 rounded-xl border border-surface-border bg-surface p-6">
          <h2 className="mb-5 text-sm font-semibold text-text-primary">Organization logo</h2>
          <div className="flex items-center gap-6">
            {/* Logo display */}
            <div className="relative shrink-0">
              <div className="h-20 w-20 overflow-hidden rounded-2xl ring-2 ring-surface-border">
                {logoPreview ? (
                  <img src={logoPreview} alt={org?.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary-subtle text-2xl font-bold text-primary">
                    {initials}
                  </div>
                )}
              </div>
              {uploadingLogo && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className={cn(
                  'flex h-8 items-center gap-2 rounded-lg border border-surface-border px-3 text-sm font-medium transition-colors',
                  'text-text-primary hover:border-primary/40 hover:bg-primary-subtle hover:text-primary',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                <Camera className="h-3.5 w-3.5" />
                {logoPreview ? 'Change logo' : 'Upload logo'}
              </button>

              {logoPreview && (
                <button
                  onClick={handleRemoveLogo}
                  disabled={uploadingLogo}
                  className="h-8 rounded-lg px-3 text-sm text-text-muted transition-colors hover:text-red-500 disabled:opacity-50"
                >
                  Remove
                </button>
              )}

              <p className="text-xs text-text-muted">Any image up to 20 MB · square logos work best</p>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </section>

        {/* Info section */}
        <section className="rounded-xl border border-surface-border bg-surface p-6">
          <h2 className="mb-5 text-sm font-semibold text-text-primary">Organization info</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="What does this organization do?"
                className="w-full resize-none rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Slug</label>
              <input
                type="text"
                value={org?.slug ?? ''}
                readOnly
                className="w-full cursor-default rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-muted outline-none"
              />
              <p className="mt-1 text-xs text-text-muted">The slug is used in URLs and cannot be changed.</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updateMutation.isPending || !infoChanged}
                className={cn(
                  'flex h-8 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors',
                  'bg-primary text-white hover:bg-primary-light',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save changes
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  )
}
