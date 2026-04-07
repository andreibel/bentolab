import {useCallback, useRef, useState} from 'react'
import Cropper from 'react-easy-crop'
import type {Area} from 'react-easy-crop'
import {Camera, CheckCircle2, KeyRound, Loader2, MailCheck, Minus, Plus, User, X, ZoomIn} from 'lucide-react'
import {toast} from 'sonner'
import {attachmentsApi} from '@/api/attachments'
import {usersApi} from '@/api/users'
import {authApi} from '@/api/auth'
import {useAuthStore} from '@/stores/authStore'
import {cn} from '@/utils/cn'

// ── Crop helper: extract the selected area from an image src ─────────────────

async function getCroppedBlob(imageSrc: string, pixelCrop: Area, outputSize = 256): Promise<Blob> {
  const img = new Image()
  img.src = imageSrc
  await new Promise<void>((res, rej) => {
    img.onload = () => res()
    img.onerror = () => rej(new Error('Image load failed'))
  })

  const canvas = document.createElement('canvas')
  canvas.width  = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    img,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    outputSize, outputSize,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => { if (blob) resolve(blob); else reject(new Error('Canvas export failed')) },
      'image/jpeg',
      0.88,
    )
  })
}

// ── Crop modal ────────────────────────────────────────────────────────────────

interface CropModalProps {
  imageSrc: string
  onApply: (blob: Blob) => void
  onCancel: () => void
}

function CropModal({ imageSrc, onApply, onCancel }: CropModalProps) {
  const [crop,   setCrop]   = useState({ x: 0, y: 0 })
  const [zoom,   setZoom]   = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [applying, setApplying] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative z-10 flex w-full max-w-md flex-col rounded-2xl border border-surface-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <h2 className="text-sm font-semibold text-text-primary">Crop avatar</h2>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative h-80 w-full overflow-hidden rounded-none bg-black">
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
              cropAreaStyle: {
                border: '2px solid rgba(91,71,224,0.8)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
              },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="border-t border-surface-border px-5 py-4">
          <div className="flex items-center gap-3">
            <ZoomIn className="h-3.5 w-3.5 shrink-0 text-text-muted" />
            <span className="w-10 shrink-0 text-xs tabular-nums text-text-muted">
              {zoom.toFixed(1)}×
            </span>
            <div className="relative flex-1">
              <input
                type="range"
                min={1}
                max={4}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-border accent-primary"
              />
            </div>
            <button
              onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
              className="rounded p-1 text-text-muted hover:text-text-primary"
              title="Zoom out"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
              className="rounded p-1 text-text-muted hover:text-text-primary"
              title="Zoom in"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-text-muted">Drag to reposition · scroll or use slider to zoom</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t border-surface-border px-5 py-3">
          <button
            onClick={onCancel}
            className="h-8 rounded-lg border border-surface-border px-4 text-sm text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={applying}
            className="flex h-8 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-60"
          >
            {applying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, currentOrgId, updateUser } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName,  setLastName]  = useState(user?.lastName  ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ?? null)

  // Crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savingProfile,   setSavingProfile]   = useState(false)

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '?'

  // ── File selected — open crop modal ────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image must be smaller than 20 MB')
      return
    }

    const url = URL.createObjectURL(file)
    setCropSrc(url)

    // Reset input so selecting the same file again still triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  // ── Crop applied — upload ──────────────────────────────────────────────────

  async function handleCropApply(blob: Blob) {
    if (!user || !currentOrgId) return
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)

    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    setUploadingAvatar(true)

    try {
      // 1. Presign
      const { attachmentId, uploadUrl } = await attachmentsApi.presign({
        entityType:  'USER_AVATAR',
        entityId:    user.id,
        orgId:       currentOrgId,
        fileName:    'avatar.jpg',
        contentType: 'image/jpeg',
        size:        file.size,
      })

      // 2. Upload directly to S3
      await attachmentsApi.uploadToS3(uploadUrl, file)

      // 3. Confirm
      await attachmentsApi.confirm(attachmentId)

      // 4. Get download URL
      const downloadUrl = await attachmentsApi.getDownloadUrl(attachmentId)

      // 5. Save to auth-service
      const updated = await usersApi.updateProfile({ avatarUrl: downloadUrl })
      updateUser({ avatarUrl: updated.avatarUrl })
      setAvatarPreview(downloadUrl)
      toast.success('Avatar updated')
    } catch (err) {
      toast.error('Failed to upload avatar')
      console.error(err)
    } finally {
      setUploadingAvatar(false)
    }
  }

  // ── Remove avatar ──────────────────────────────────────────────────────────

  async function handleRemoveAvatar() {
    if (!user) return
    setUploadingAvatar(true)
    try {
      const updated = await usersApi.updateProfile({ avatarUrl: '' })
      updateUser({ avatarUrl: updated.avatarUrl ?? null })
      setAvatarPreview(null)
      toast.success('Avatar removed')
    } catch {
      toast.error('Failed to remove avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // ── Save name ──────────────────────────────────────────────────────────────

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) return

    setSavingProfile(true)
    try {
      const updated = await usersApi.updateProfile({
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
      })
      updateUser({ firstName: updated.firstName, lastName: updated.lastName })
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const nameChanged = firstName.trim() !== (user?.firstName ?? '') ||
                      lastName.trim()  !== (user?.lastName  ?? '')

  // ── Password reset ─────────────────────────────────────────────────────────

  const [sentReset, setSentReset] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)

  async function handleSendPasswordReset() {
    if (!user?.email) return
    setSendingReset(true)
    try {
      await authApi.forgotPassword(user.email)
      setSentReset(true)
      toast.success('Password reset email sent')
    } catch {
      toast.error('Failed to send reset email')
    } finally {
      setSendingReset(false)
    }
  }

  // ── Resend verification ────────────────────────────────────────────────────

  const [sentVerification, setSentVerification] = useState(false)
  const [sendingVerification, setSendingVerification] = useState(false)

  async function handleResendVerification() {
    if (!user?.email) return
    setSendingVerification(true)
    try {
      await authApi.resendVerification(user.email)
      setSentVerification(true)
      toast.success('Verification email sent')
    } catch {
      toast.error('Failed to send verification email')
    } finally {
      setSendingVerification(false)
    }
  }

  return (
    <>
      {/* Crop modal */}
      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onApply={handleCropApply}
          onCancel={handleCropCancel}
        />
      )}

      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Profile</h1>
            <p className="text-sm text-text-muted">Manage your personal information and avatar.</p>
          </div>
        </div>

        {/* Avatar section */}
        <section className="mb-8 rounded-xl border border-surface-border bg-surface p-6">
          <h2 className="mb-5 text-sm font-semibold text-text-primary">Avatar</h2>

          <div className="flex items-center gap-6">
            {/* Avatar display */}
            <div className="relative shrink-0">
              <div className="h-20 w-20 overflow-hidden rounded-full ring-2 ring-surface-border">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Your avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary-subtle text-2xl font-bold text-primary">
                    {initials}
                  </div>
                )}
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Upload controls */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className={cn(
                  'flex h-8 items-center gap-2 rounded-lg border border-surface-border px-3 text-sm font-medium transition-colors',
                  'text-text-primary hover:border-primary/40 hover:bg-primary-subtle hover:text-primary',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                <Camera className="h-3.5 w-3.5" />
                {avatarPreview ? 'Change avatar' : 'Upload avatar'}
              </button>

              {avatarPreview && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  className="h-8 rounded-lg px-3 text-sm text-text-muted transition-colors hover:text-red-500 disabled:opacity-50"
                >
                  Remove
                </button>
              )}

              <p className="text-xs text-text-muted">
                Any image up to 20 MB · you can zoom and crop before saving
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </section>

        {/* Name section */}
        <section className="mb-8 rounded-xl border border-surface-border bg-surface p-6">
          <h2 className="mb-5 text-sm font-semibold text-text-primary">Personal information</h2>

          <form onSubmit={handleSaveName} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  First name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Last name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                Email address
              </label>
              <input
                type="email"
                value={user?.email ?? ''}
                readOnly
                className="w-full cursor-default rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-text-muted outline-none"
              />
              <p className="mt-1 text-xs text-text-muted">Email cannot be changed here.</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile || !nameChanged}
                className={cn(
                  'flex h-8 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors',
                  'bg-primary text-white hover:bg-primary-light',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                {savingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save changes
              </button>
            </div>
          </form>
        </section>
        {/* Password section */}
        <section className="mb-8 rounded-xl border border-surface-border bg-surface p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
              <KeyRound className="h-4 w-4 text-text-muted" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-text-primary">Password</h2>
              <p className="mt-0.5 text-xs text-text-muted">
                We'll send a reset link to <span className="font-medium text-text-primary">{user?.email}</span>.
                Follow the link to set a new password.
              </p>
              <div className="mt-4">
                {sentReset ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Reset email sent — check your inbox.
                  </div>
                ) : (
                  <button
                    onClick={handleSendPasswordReset}
                    disabled={sendingReset}
                    className={cn(
                      'flex h-8 items-center gap-2 rounded-lg border border-surface-border px-4 text-sm font-medium transition-colors',
                      'text-text-primary hover:border-primary/40 hover:bg-primary-subtle hover:text-primary',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                    )}
                  >
                    {sendingReset && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Send password reset email
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Email verification */}
        {!user?.emailVerified && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/40 dark:bg-amber-900/10">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <MailCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Email not verified</h2>
                <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                  Verify your email address to unlock all features.
                </p>
                <div className="mt-4">
                  {sentVerification ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Verification email sent — check your inbox.
                    </div>
                  ) : (
                    <button
                      onClick={handleResendVerification}
                      disabled={sendingVerification}
                      className="flex h-8 items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50 dark:border-amber-700 dark:bg-transparent dark:text-amber-300"
                    >
                      {sendingVerification && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Resend verification email
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
