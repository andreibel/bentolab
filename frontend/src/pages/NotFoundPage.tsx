import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  title: string
  subtitle: string
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
      return {
        icon: Rocket,
        title: 'Sprint not found',
        subtitle: 'This sprint finished the race and left no trace behind.',
        hint: `Sprints · Lab ${labId.slice(0, 8)}…`,
      }
    if (sub === 'timeline')
      return {
        icon: Clock,
        title: 'Off the timeline',
        subtitle: 'This part of the timeline was never plotted — or was quietly erased.',
        hint: `Timeline · Lab ${labId.slice(0, 8)}…`,
      }
    if (sub === 'backlog')
      return {
        icon: ListTodo,
        title: 'Backlog lost',
        subtitle: 'The backlog went so far back it fell off the edge of the board.',
        hint: `Backlog · Lab ${labId.slice(0, 8)}…`,
      }
    if (sub === 'reports')
      return {
        icon: BarChart2,
        title: 'No metrics here',
        subtitle: 'The data for this lab went dark. Even the error rate is 0.',
        hint: `Reports · Lab ${labId.slice(0, 8)}…`,
      }
    if (sub === 'milestones')
      return {
        icon: Milestone,
        title: 'Milestone missed',
        subtitle: 'This milestone was either never reached or never set.',
        hint: `Milestones · Lab ${labId.slice(0, 8)}…`,
      }
    if (sub === 'members')
      return {
        icon: Users,
        title: 'No one here',
        subtitle: "This lab's members page doesn't exist — or the lab itself doesn't.",
        hint: `Members · Lab ${labId.slice(0, 8)}…`,
      }
    // Generic lab not found
    return {
      icon: FlaskConical,
      title: 'Lab not found',
      subtitle: "This lab doesn't exist, or you haven't been given access.",
      hint: `Lab ${labId.slice(0, 8)}… — classified or deleted`,
    }
  }

  if (root === 'settings')
    return {
      icon: Settings2,
      title: 'Setting not found',
      subtitle: "You've wandered into an unmapped section of the control room.",
      hint: 'Navigate from the sidebar instead',
    }

  if (root === 'timeline')
    return {
      icon: Clock,
      title: 'Lost in time',
      subtitle: "This timeline doesn't exist in any known dimension.",
    }

  if (root === 'reports')
    return {
      icon: BarChart2,
      title: 'No data found',
      subtitle: 'The metrics went missing. Even the error rate is 0.',
    }

  if (root === 'calendar')
    return {
      icon: Calendar,
      title: 'Date not found',
      subtitle: "Mark this one in your calendar: this page doesn't exist.",
    }

  if (root === 'inbox')
    return {
      icon: Mail,
      title: 'Empty inbox',
      subtitle: "No messages here — because this page doesn't exist.",
    }

  if (root === 'my-issues')
    return {
      icon: CircleUser,
      title: 'No issues found',
      subtitle: "Turns out you have no issues. Well — this page doesn't exist at least.",
    }

  // Deep nested paths — probably someone hand-editing the URL
  if (segments.length >= 4)
    return {
      icon: Compass,
      title: 'Deep space',
      subtitle: "No signal. You've gone further than the maps reach.",
      hint: pathname,
    }

  // Generic fallback
  return {
    icon: Rocket,
    title: 'Page not found',
    subtitle: "Whatever you were looking for isn't here. Maybe it never was.",
  }
}

export default function NotFoundPage() {
  const location = useLocation()
  const navigate = useNavigate()
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
          <h1 className="text-2xl font-bold text-text-primary">{egg.title}</h1>
          <p className="max-w-sm text-sm leading-relaxed text-text-secondary">{egg.subtitle}</p>
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
            Go back
          </Button>
          <Button variant="primary" size="md" onClick={() => navigate('/')}>
            <Home className="h-4 w-4" />
            Go home
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
