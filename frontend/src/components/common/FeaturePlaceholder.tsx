import {cn} from '@/utils/cn'
import * as React from "react";

interface FeaturePlaceholderProps {
  icon: React.ElementType
  title: string
  description: string
  badge?: string
  badgeColor?: string
  preview?: React.ReactNode
  actions?: React.ReactNode
}

export function FeaturePlaceholder({
  icon: Icon,
  title,
  description,
  badge = 'Coming Soon',
  badgeColor = 'bg-primary-subtle text-primary',
  preview,
  actions,
}: FeaturePlaceholderProps) {
  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-subtle">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary">{title}</h1>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', badgeColor)}>
                {badge}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-text-secondary">{description}</p>
          </div>
        </div>
        {actions}
      </div>

      {/* Preview */}
      <div className="overflow-hidden rounded-xl border border-surface-border bg-surface">
        {preview}
      </div>
    </div>
  )
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-surface-border', className)} />
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-surface-border', className)} />
}
