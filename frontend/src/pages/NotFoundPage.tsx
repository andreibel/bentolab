import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  FlaskConical,
  Settings2,
  Calendar,
  BarChart2,
  Clock,
  Mail,
  CircleUser,
  Rocket,
  Home,
  ArrowLeft,
  Compass,
  ListTodo,
  Milestone,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

type EasterEgg = {
  icon: React.ElementType
  titleKey: string
  subtitleKey: string
  hint?: string
}

function getEasterEgg(pathname: string): EasterEgg {
  const segments = pathname.split('/').filter(Boolean)
  const root = segments[0]
  const labId = segments[1]
  const sub = segments[2]

  // /boards/:id/* — lab-specific routes
  if (root === 'boards' && labId) {
    if (sub === 'sprints')
      return { icon: Rocket,      titleKey: 'notFound.sprint.title',     subtitleKey: 'notFound.sprint.subtitle',     hint: `Sprints · Lab ${labId.slice(0, 8)}…` }
    if (sub === 'timeline')
      return { icon: Clock,       titleKey: 'notFound.timeline.title',   subtitleKey: 'notFound.timeline.subtitle',   hint: `Timeline · Lab ${labId.slice(0, 8)}…` }
    if (sub === 'backlog')
      return { icon: ListTodo,    titleKey: 'notFound.backlog.title',    subtitleKey: 'notFound.backlog.subtitle',    hint: `Backlog · Lab ${labId.slice(0, 8)}…` }
    if (sub === 'reports')
      return { icon: BarChart2,   titleKey: 'notFound.reports.title',    subtitleKey: 'notFound.reports.subtitle',   hint: `Reports · Lab ${labId.slice(0, 8)}…` }
    if (sub === 'milestones')
      return { icon: Milestone,   titleKey: 'notFound.milestones.title', subtitleKey: 'notFound.milestones.subtitle', hint: `Milestones · Lab ${labId.slice(0, 8)}…` }
    if (sub === 'members')
      return { icon: Users,       titleKey: 'notFound.members.title',    subtitleKey: 'notFound.members.subtitle',    hint: `Members · Lab ${labId.slice(0, 8)}…` }
    return { icon: FlaskConical,  titleKey: 'notFound.lab.title',        subtitleKey: 'notFound.lab.subtitle',        hint: `Lab ${labId.slice(0, 8)}… — classified or deleted` }
  }

  if (root === 'settings')
    return { icon: Settings2,  titleKey: 'notFound.settings.title',   subtitleKey: 'notFound.settings.subtitle',  hint: 'Navigate from the sidebar instead' }
  if (root === 'timeline')
    return { icon: Clock,      titleKey: 'notFound.lostInTime.title',  subtitleKey: 'notFound.lostInTime.subtitle' }
  if (root === 'reports')
    return { icon: BarChart2,  titleKey: 'notFound.noData.title',      subtitleKey: 'notFound.noData.subtitle' }
  if (root === 'calendar')
    return { icon: Calendar,   titleKey: 'notFound.calendar.title',    subtitleKey: 'notFound.calendar.subtitle' }
  if (root === 'inbox')
    return { icon: Mail,       titleKey: 'notFound.inbox.title',       subtitleKey: 'notFound.inbox.subtitle' }
  if (root === 'my-issues')
    return { icon: CircleUser, titleKey: 'notFound.myIssues.title',    subtitleKey: 'notFound.myIssues.subtitle' }

  if (segments.length >= 4)
    return { icon: Compass,    titleKey: 'notFound.deepSpace.title',   subtitleKey: 'notFound.deepSpace.subtitle',  hint: pathname }

  return { icon: Rocket,       titleKey: 'notFound.generic.title',     subtitleKey: 'notFound.generic.subtitle' }
}

export default function NotFoundPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const egg = getEasterEgg(location.pathname)
  const Icon = egg.icon

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-muted px-4">
      {/* Faint giant 404 watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex select-none items-center justify-center"
      >
        <span
          className="text-[clamp(8rem,30vw,22rem)] font-black leading-none text-surface-border"
          style={{ opacity: 0.6 }}
        >
          404
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Floating icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-subtle shadow-sm"
          >
            <Icon className="h-9 w-9 text-primary" />
          </motion.div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="flex flex-col items-center gap-1.5"
        >
          <h1 className="text-2xl font-bold text-text-primary">{t(egg.titleKey)}</h1>
          <p className="max-w-sm text-sm leading-relaxed text-text-secondary">{t(egg.subtitleKey)}</p>
          {egg.hint && (
            <p className="mt-1 rounded-md bg-surface px-2.5 py-1 font-mono text-xs text-text-muted ring-1 ring-surface-border">
              {egg.hint}
            </p>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
          className="flex items-center gap-2.5"
        >
          <Button variant="ghost" size="md" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            {t('notFound.goBack')}
          </Button>
          <Button variant="primary" size="md" onClick={() => navigate('/')}>
            <Home className="h-4 w-4" />
            {t('notFound.goHome')}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
