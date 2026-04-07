import {useState} from 'react'
import {useMutation} from '@tanstack/react-query'
import {useTranslation} from 'react-i18next'
import {Check, Globe, Loader2, Moon, Sun, SunMoon} from 'lucide-react'
import {toast} from 'sonner'
import {usersApi} from '@/api/users'
import {useAuthStore} from '@/stores/authStore'
import {type DateFormat, type TimeFormat, type Theme, type WeekDay, useUIStore} from '@/stores/uiStore'
import {cn} from '@/utils/cn'

// ── Constants ─────────────────────────────────────────────────────────────────

interface LangOption {
  code: string
  label: string
  nativeLabel: string
  dir: 'ltr' | 'rtl'
  flag: string
}

const LANGUAGES: LangOption[] = [
  { code: 'en', label: 'English',  nativeLabel: 'English', dir: 'ltr', flag: '🇬🇧' },
  { code: 'he', label: 'Hebrew',   nativeLabel: 'עברית',   dir: 'rtl', flag: '🇮🇱' },
]

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Jerusalem',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const DATE_FORMATS: { value: DateFormat; example: string }[] = [
  { value: 'MM/DD/YYYY', example: '04/07/2026' },
  { value: 'DD/MM/YYYY', example: '07/04/2026' },
  { value: 'YYYY-MM-DD', example: '2026-04-07' },
]

const TIME_FORMATS: { value: TimeFormat; example: string }[] = [
  { value: '12h', example: '2:30 PM' },
  { value: '24h', example: '14:30'   },
]

// 0=Sun…6=Sat
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const DAY_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const WEEK_START_OPTIONS: WeekDay[] = [0, 1, 6]

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-xl border border-surface-border bg-surface">
      <div className="border-b border-surface-border px-6 py-4">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

// ── Row helpers ───────────────────────────────────────────────────────────────

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-8">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-text-muted">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

// ── Theme toggle ──────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useUIStore()

  const options: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: 'Light', icon: Sun  },
    { value: 'dark',  label: 'Dark',  icon: Moon },
  ]

  return (
    <div className="flex gap-2">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
            theme === value
              ? 'border-primary bg-primary-subtle text-primary'
              : 'border-surface-border text-text-secondary hover:border-primary/40 hover:text-text-primary',
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Segmented buttons (for date/time format) ──────────────────────────────────

function SegmentedGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; example: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-surface-border">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex flex-col items-center px-4 py-2 text-xs transition-colors',
            i > 0 && 'border-s border-surface-border',
            value === opt.value
              ? 'bg-primary-subtle text-primary font-semibold'
              : 'bg-surface text-text-secondary hover:bg-surface-muted',
          )}
        >
          <span className="font-mono">{opt.example}</span>
          <span className="mt-0.5 text-[10px] text-text-muted">{opt.value}</span>
        </button>
      ))}
    </div>
  )
}

// ── Working days picker ───────────────────────────────────────────────────────

function WorkingDaysPicker() {
  const { workingDays, setWorkingDays } = useUIStore()
  const allDays: WeekDay[] = [0, 1, 2, 3, 4, 5, 6]

  function toggle(day: WeekDay) {
    if (workingDays.includes(day)) {
      // don't allow deselecting all
      if (workingDays.length === 1) return
      setWorkingDays(workingDays.filter((d) => d !== day))
    } else {
      setWorkingDays([...workingDays, day].sort((a, b) => a - b) as WeekDay[])
    }
  }

  return (
    <div className="flex gap-1.5">
      {allDays.map((day) => {
        const active = workingDays.includes(day)
        return (
          <button
            key={day}
            onClick={() => toggle(day)}
            title={DAY_FULL[day]}
            className={cn(
              'h-9 w-9 rounded-lg text-xs font-semibold transition-colors',
              active
                ? 'bg-primary text-white'
                : 'bg-surface-muted text-text-muted hover:bg-surface-border hover:text-text-primary',
            )}
          >
            {DAY_NAMES[day]}
          </button>
        )
      })}
    </div>
  )
}

// ── Language card ─────────────────────────────────────────────────────────────

function LanguageCard({ lang, selected, onSelect }: { lang: LangOption; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative flex w-36 flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors',
        selected
          ? 'border-primary bg-primary-subtle'
          : 'border-surface-border bg-surface hover:border-primary/40',
      )}
    >
      <span className="text-2xl">{lang.flag}</span>
      <div>
        <p className="text-sm font-semibold text-text-primary">{lang.nativeLabel}</p>
        <p className="text-xs text-text-muted">{lang.label}</p>
      </div>
      {lang.dir === 'rtl' && (
        <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-text-muted">RTL</span>
      )}
      {selected && (
        <span className="absolute end-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </span>
      )}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PreferencesPage() {
  const { i18n } = useTranslation()
  const { user, updateUser } = useAuthStore()
  const {
    dateFormat, setDateFormat,
    timeFormat, setTimeFormat,
    weekStartDay, setWeekStartDay,
  } = useUIStore()

  const [timezone, setTimezone] = useState(user?.timezone ?? 'UTC')

  const profileMutation = useMutation({
    mutationFn: (data: { locale?: string; timezone?: string }) =>
      usersApi.updateProfile(data),
    onSuccess: (updated) => {
      updateUser({ locale: updated.locale, timezone: updated.timezone })
      toast.success('Preferences saved')
    },
    onError: () => toast.error('Failed to save preferences'),
  })

  function handleLanguageSelect(lang: LangOption) {
    i18n.changeLanguage(lang.code)
    profileMutation.mutate({ locale: lang.code })
  }

  function handleTimezoneChange(tz: string) {
    setTimezone(tz)
    profileMutation.mutate({ timezone: tz })
  }

  const currentLang = i18n.language.split('-')[0]

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle">
          <SunMoon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Preferences</h1>
          <p className="text-sm text-text-muted">Language, region, work schedule, and appearance.</p>
        </div>
      </div>

      {/* ── Language ──────────────────────────────────────────────────────── */}
      <Section title="Language">
        <div className="mb-4 flex items-center gap-2 text-xs text-text-muted">
          <Globe className="h-3.5 w-3.5" />
          Changing language also updates the page direction for RTL languages.
        </div>
        <div className="flex flex-wrap gap-3">
          {LANGUAGES.map((lang) => (
            <LanguageCard
              key={lang.code}
              lang={lang}
              selected={currentLang === lang.code}
              onSelect={() => handleLanguageSelect(lang)}
            />
          ))}
        </div>
        {profileMutation.isPending && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving…
          </div>
        )}
      </Section>

      {/* ── Region ────────────────────────────────────────────────────────── */}
      <Section title="Region">
        <div className="space-y-5">

          <FieldRow label="Timezone" hint="Used for due date reminders and activity timestamps.">
            <select
              value={timezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </FieldRow>

          <div className="border-t border-surface-border" />

          <FieldRow label="Date format" hint="How dates are displayed across the app.">
            <SegmentedGroup
              options={DATE_FORMATS}
              value={dateFormat}
              onChange={setDateFormat}
            />
          </FieldRow>

          <div className="border-t border-surface-border" />

          <FieldRow label="Time format" hint="12-hour or 24-hour clock.">
            <SegmentedGroup
              options={TIME_FORMATS}
              value={timeFormat}
              onChange={setTimeFormat}
            />
          </FieldRow>
        </div>
      </Section>

      {/* ── Work Schedule ─────────────────────────────────────────────────── */}
      <Section title="Work Schedule">
        <p className="mb-5 text-xs text-text-muted">
          Non-working days are shaded in the timeline view. These settings are stored locally on this device.
        </p>
        <div className="space-y-5">

          <FieldRow label="Week starts on" hint="First day shown in calendar and timeline columns.">
            <div className="flex overflow-hidden rounded-lg border border-surface-border">
              {WEEK_START_OPTIONS.map((day, i) => (
                <button
                  key={day}
                  onClick={() => setWeekStartDay(day)}
                  className={cn(
                    'px-4 py-2 text-sm transition-colors',
                    i > 0 && 'border-s border-surface-border',
                    weekStartDay === day
                      ? 'bg-primary-subtle font-semibold text-primary'
                      : 'bg-surface text-text-secondary hover:bg-surface-muted',
                  )}
                >
                  {DAY_FULL[day]}
                </button>
              ))}
            </div>
          </FieldRow>

          <div className="border-t border-surface-border" />

          <FieldRow
            label="Working days"
            hint="Days highlighted as work days in the timeline."
          >
            <WorkingDaysPicker />
          </FieldRow>
        </div>
      </Section>

      {/* ── Appearance ────────────────────────────────────────────────────── */}
      <Section title="Appearance">
        <FieldRow label="Theme" hint="Choose between light and dark mode.">
          <ThemeToggle />
        </FieldRow>
      </Section>
    </div>
  )
}
