import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  /** Accessible description, shown to screen readers only */
  description?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  className?: string
}

function Modal({ open, onClose, title, description, maxWidth = 'sm', children, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={cn(
              'w-full rounded-2xl border border-surface-border bg-surface shadow-2xl',
              maxWidth === 'sm' && 'max-w-sm',
              maxWidth === 'md' && 'max-w-md',
              maxWidth === 'lg' && 'max-w-lg',
              maxWidth === 'xl' && 'max-w-xl',
              className,
            )}
          >
            <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
              <Dialog.Title className="text-sm font-semibold text-text-primary">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="sr-only">{description}</Dialog.Description>
              )}
              <Dialog.Close asChild>
                <button className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function ModalBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4 px-5 py-4', className)}>
      {children}
    </div>
  )
}

function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex justify-end gap-2 border-t border-surface-border px-5 py-4', className)}>
      {children}
    </div>
  )
}

Modal.Body   = ModalBody
Modal.Footer = ModalFooter

export { Modal }
