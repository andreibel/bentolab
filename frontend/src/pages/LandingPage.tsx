import { motion } from 'framer-motion'
import {
  ArrowRight,
  Kanban,
  Zap,
  Users,
  ShieldCheck,
  Github,
  BarChart2,
  CheckCircle2,
} from 'lucide-react'
import { Link } from 'react-router-dom'

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
  }),
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Kanban,
    title: 'Kanban & Scrum',
    description:
      'Full Scrum board with sprints, backlog, and burndown charts. Or keep it simple with Kanban.',
  },
  {
    icon: Users,
    title: 'Multi-tenancy',
    description:
      'Manage multiple organizations, each with their own boards, members, and roles.',
  },
  {
    icon: Zap,
    title: 'Real-time updates',
    description:
      'Activity feeds, notifications, and instant issue updates keep your team in sync.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    description:
      'Fine-grained permissions at both org and board level — from Viewer to Product Owner.',
  },
  {
    icon: BarChart2,
    title: 'Sprint analytics',
    description:
      'Velocity tracking, burndown charts, and retrospectives built right in.',
  },
  {
    icon: Github,
    title: 'Self-hostable',
    description:
      'Deploy on your own infrastructure with Docker. Full control, no vendor lock-in.',
  },
]

const steps = [
  { number: '01', title: 'Create an org', description: 'Set up your organization and invite teammates in seconds.' },
  { number: '02', title: 'Build a board', description: 'Choose Scrum or Kanban. Default columns are created automatically.' },
  { number: '03', title: 'Track issues', description: 'Create, assign, and move issues. Log time, add comments, link relations.' },
  { number: '04', title: 'Ship faster', description: 'Run sprints, track velocity, and retrospect — all in one place.' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-surface-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Bento" className="h-7 w-7" />
          <span className="text-[1.1rem] font-bold tracking-[-0.5px] text-text-primary">
            bento
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-text-secondary md:flex">
          <a href="#features" className="transition-colors hover:text-text-primary">Features</a>
          <a href="#how-it-works" className="transition-colors hover:text-text-primary">How it works</a>
          <a href="#pricing" className="transition-colors hover:text-text-primary">Pricing</a>
          {/* Docs — will be a VitePress site at /docs or docs.bento.io */}
          <a href="/docs" className="transition-colors hover:text-text-primary">Docs</a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-text-primary"
          >
            GitHub
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-medium text-white transition-colors hover:bg-primary-light"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-14 text-center">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#5B47E0 1px, transparent 1px), linear-gradient(90deg, #5B47E0 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-primary opacity-[0.06] blur-[120px]" />
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center gap-6"
      >
        <motion.div variants={fadeUp} custom={0}>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-subtle px-3.5 py-1 text-xs font-semibold text-primary">
            Open source · Self-hostable
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          custom={0.05}
          className="max-w-3xl text-5xl font-bold tracking-tight text-text-primary md:text-6xl lg:text-7xl"
          style={{ letterSpacing: '-0.02em', lineHeight: 1.05 }}
        >
          Project management
          <br />
          <span className="text-primary">that stays out of your way</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={0.1}
          className="max-w-xl text-lg text-text-secondary"
        >
          Bento is a self-hosted Jira alternative built for teams that want
          Scrum and Kanban without the bloat. Ships as a single Docker Compose file.
        </motion.p>

        <motion.div
          variants={fadeUp}
          custom={0.15}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/register"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-light hover:shadow-primary/25 hover:shadow-lg"
          >
            Start for free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-surface-border bg-surface px-6 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-muted"
          >
            See how it works
          </a>
        </motion.div>

        <motion.div
          variants={fadeUp}
          custom={0.2}
          className="flex items-center gap-6 text-xs text-text-muted"
        >
          {['No credit card required', 'MIT licensed', 'Docker in 5 min'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              {t}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* Board mockup placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto mt-16 w-full max-w-5xl"
      >
        <div className="overflow-hidden rounded-xl border border-surface-border bg-surface shadow-xl shadow-black/5">
          {/* Window chrome */}
          <div className="flex h-9 items-center gap-1.5 border-b border-surface-border bg-surface-muted px-4">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <div className="ms-3 h-4 w-40 rounded bg-surface-border" />
          </div>
          {/* Kanban board skeleton */}
          <div className="flex gap-4 p-5">
            {[
              { label: 'To Do', count: 4, color: 'bg-surface-border' },
              { label: 'In Progress', count: 2, color: 'bg-primary/10' },
              { label: 'In Review', count: 1, color: 'bg-accent/10' },
              { label: 'Done', count: 6, color: 'bg-emerald-50' },
            ].map((col) => (
              <div key={col.label} className="flex-1">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-secondary">{col.label}</span>
                  <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-xs text-text-muted">
                    {col.count}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {Array.from({ length: col.count > 3 ? 3 : col.count }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border border-surface-border ${col.color} p-3`}
                    >
                      <div className="mb-2 h-2 w-3/4 rounded bg-surface-border" />
                      <div className="h-2 w-1/2 rounded bg-surface-border opacity-60" />
                      <div className="mt-3 flex items-center justify-between">
                        <div className="h-5 w-5 rounded-full bg-surface-border" />
                        <div className="h-2 w-8 rounded bg-surface-border opacity-40" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="mb-14 text-center"
        >
          <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Features
          </motion.p>
          <motion.h2 variants={fadeUp} custom={0.05} className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
            Everything your team needs
          </motion.h2>
          <motion.p variants={fadeUp} custom={0.1} className="mt-4 text-text-secondary">
            No plugins, no marketplace. The features that actually matter, built-in.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="group rounded-xl border border-surface-border bg-surface p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-text-primary">{f.title}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-surface-muted px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="mb-14 text-center"
        >
          <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            How it works
          </motion.p>
          <motion.h2 variants={fadeUp} custom={0.05} className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
            Up and running in minutes
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((step, i) => (
            <motion.div key={step.number} variants={fadeUp} custom={i * 0.05} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute start-full top-5 hidden h-px w-6 bg-surface-border lg:block" />
              )}
              <div className="mb-4 text-3xl font-bold text-primary/20">{step.number}</div>
              <h3 className="mb-2 text-base font-semibold text-text-primary">{step.title}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="mb-14 text-center"
        >
          <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Pricing
          </motion.p>
          <motion.h2 variants={fadeUp} custom={0.05} className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
            Simple, honest pricing
          </motion.h2>
          <motion.p variants={fadeUp} custom={0.1} className="mt-4 text-text-secondary">
            Self-host for free, forever. Cloud coming soon.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {/* Self-host */}
          <motion.div variants={fadeUp} className="rounded-xl border border-surface-border bg-surface p-7">
            <p className="mb-1 text-sm font-semibold text-text-secondary">Self-hosted</p>
            <p className="mb-4 text-4xl font-bold text-text-primary">Free</p>
            <p className="mb-6 text-sm text-text-secondary">
              Deploy on your own hardware. MIT licensed. No limits.
            </p>
            <ul className="mb-8 flex flex-col gap-2.5 text-sm text-text-secondary">
              {['Unlimited users', 'Unlimited boards', 'All features', 'Docker Compose'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-surface-border bg-surface-muted px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-border"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </motion.div>

          {/* Cloud */}
          <motion.div variants={fadeUp} custom={0.05} className="relative rounded-xl border-2 border-primary bg-surface p-7 shadow-lg shadow-primary/10">
            <div className="absolute -top-3 start-6 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
              Coming soon
            </div>
            <p className="mb-1 text-sm font-semibold text-text-secondary">Cloud</p>
            <p className="mb-4 text-4xl font-bold text-text-primary">
              $9
              <span className="text-base font-normal text-text-muted">/mo</span>
            </p>
            <p className="mb-6 text-sm text-text-secondary">
              Managed hosting. We handle infra so you can focus on shipping.
            </p>
            <ul className="mb-8 flex flex-col gap-2.5 text-sm text-text-secondary">
              {['Up to 20 users', '10 boards', 'All features', 'Automatic backups', 'Email notifications'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <button
              disabled
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white opacity-60 cursor-not-allowed"
            >
              Notify me
            </button>
          </motion.div>

          {/* Enterprise */}
          <motion.div variants={fadeUp} custom={0.1} className="rounded-xl border border-surface-border bg-surface p-7">
            <p className="mb-1 text-sm font-semibold text-text-secondary">Enterprise</p>
            <p className="mb-4 text-4xl font-bold text-text-primary">Custom</p>
            <p className="mb-6 text-sm text-text-secondary">
              Large teams, SSO, SLA, custom deployment. Let's talk.
            </p>
            <ul className="mb-8 flex flex-col gap-2.5 text-sm text-text-secondary">
              {['Unlimited everything', 'SSO / SAML', 'Priority support', 'Custom SLA', 'On-premise'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="mailto:hello@bento.io"
              className="inline-flex w-full items-center justify-center rounded-lg border border-surface-border bg-surface-muted px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-border"
            >
              Contact us
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="bg-primary px-6 py-20 text-center">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="mx-auto max-w-2xl"
      >
        <motion.h2 variants={fadeUp} className="mb-4 text-3xl font-bold tracking-tight text-white md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
          Ready to ship faster?
        </motion.h2>
        <motion.p variants={fadeUp} custom={0.05} className="mb-8 text-primary-light">
          Deploy Bento in minutes with a single Docker Compose command. No account needed.
        </motion.p>
        <motion.div variants={fadeUp} custom={0.1} className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-primary transition-colors hover:bg-primary-subtle"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/30 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <Github className="h-4 w-4" />
            Star on GitHub
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-surface-border px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Bento" className="h-6 w-6" />
          <span className="text-sm font-bold tracking-[-0.5px] text-text-primary">bento</span>
          <span className="text-sm text-text-muted">— MIT License</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted">
          <a href="#features" className="hover:text-text-primary">Features</a>
          <a href="#pricing" className="hover:text-text-primary">Pricing</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary">GitHub</a>
          <a href="mailto:hello@bento.io" className="hover:text-text-primary">Contact</a>
        </div>
        <p className="text-xs text-text-muted">© 2026 Bento. All rights reserved.</p>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <Nav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
