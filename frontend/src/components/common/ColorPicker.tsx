import { cn } from '@/utils/cn'

export const DEFAULT_COLORS = [
  '#6B7280', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#F97316',
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  colors?: string[]
  label?: string
  /** Render a preview strip next to the swatches (useful for board backgrounds) */
  showPreview?: boolean
}

export function ColorPicker({
  value,
  onChange,
  colors = DEFAULT_COLORS,
  label,
  showPreview = false,
}: ColorPickerProps) {
  return (
    <div>
      {label && <p className="mb-2 text-sm font-medium text-text-primary">{label}</p>}
      <div className="flex items-center gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              'h-6 w-6 rounded-full transition-transform hover:scale-110',
              value === color && 'ring-2 ring-offset-2 ring-primary dark:ring-offset-surface',
            )}
            style={{ backgroundColor: color }}
          />
        ))}
        {showPreview && (
          <div
            className="ms-2 flex-1 rounded-lg"
            style={{ backgroundColor: value || colors[0] }}
          />
        )}
      </div>
    </div>
  )
}
