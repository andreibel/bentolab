import {useEffect} from 'react'
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {Toaster} from 'sonner'
import {useAuthStore} from '@/stores/authStore'
import {useUIStore} from '@/stores/uiStore'
import {AppLayout} from '@/components/layout/AppLayout'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import InviteAcceptPage from '@/pages/auth/InviteAcceptPage'
import CreateOrgPage from '@/pages/org/CreateOrgPage'
import BoardListPage from '@/pages/board/BoardListPage'
import BoardPage from '@/pages/board/BoardPage'
import BacklogPage from '@/pages/board/BacklogPage'
import SprintsPage from '@/pages/board/SprintsPage'
import SummaryPageComponent from '@/pages/board/SummaryPage'
import CalendarPage from '@/pages/CalendarPage'
import MyIssuesPage from '@/pages/MyIssuesPage'
import InboxPage from '@/pages/InboxPage'
import AutomationsPage from '@/pages/settings/AutomationsPage'
import SecurityPage from '@/pages/settings/SecurityPage'
import MembersPage from '@/pages/settings/MembersPage'
import ProfilePage from '@/pages/settings/ProfilePage'
import OrgGeneralPage from '@/pages/settings/OrgGeneralPage'
import TimelinePage from '@/pages/board/TimelinePage'
import GlobalTimelinePage from '@/pages/GlobalTimelinePage'
import {FeaturePlaceholder} from '@/components/common/FeaturePlaceholder'
import {BarChart2, LayoutDashboard} from 'lucide-react'

const RTL_LANGS = ['he', 'ar', 'fa']

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, refreshToken, isInitialized } = useAuthStore()
  if (!isInitialized) return null
  if (!accessToken && !refreshToken) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Lab sub-route placeholders
const SummaryPage = SummaryPageComponent
const LabReports  = () => <FeaturePlaceholder icon={BarChart2} title="Reports" description="Velocity, burndown, and cycle time analytics for this lab." badge="Coming Soon" />

// Global workspace placeholders
const GlobalSummary = () => <FeaturePlaceholder icon={LayoutDashboard} title="Summary" description="Overview of all your boards — issues, activity, and progress across your workspace." badge="Coming Soon" />
const GlobalReports = () => <FeaturePlaceholder icon={BarChart2}       title="Reports" description="Analytics and insights across all boards — velocity, cycle time, and trends."       badge="Coming Soon" />

export default function App() {
  const { i18n } = useTranslation()
  const initialize = useAuthStore((s) => s.initialize)
  const theme = useUIStore((s) => s.theme)

  useEffect(() => { initialize() }, [initialize])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    const dir = RTL_LANGS.includes(i18n.language) ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', i18n.language)
  }, [i18n.language])

  return (
    <BrowserRouter>
      <Toaster position="bottom-center" richColors />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/invite" element={<InviteAcceptPage />} />

        {/* Onboarding */}
        <Route path="/org/new" element={<ProtectedRoute><CreateOrgPage /></ProtectedRoute>} />

        {/* App shell */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>

          {/* Labs list */}
          <Route path="/boards" element={<BoardListPage />} />

          {/* Lab (board) — with sub-routes */}
          <Route path="/boards/:boardId"          element={<BoardPage />} />
          <Route path="/boards/:boardId/summary"  element={<SummaryPage />} />
          <Route path="/boards/:boardId/backlog"  element={<BacklogPage />} />
          <Route path="/boards/:boardId/sprints"  element={<SprintsPage />} />
          <Route path="/boards/:boardId/timeline" element={<TimelinePage />} />
          <Route path="/boards/:boardId/reports"  element={<LabReports />} />

          {/* Workspace global views */}
          <Route path="/summary"   element={<GlobalSummary />} />
          <Route path="/timeline"  element={<GlobalTimelinePage />} />
          <Route path="/reports"   element={<GlobalReports />} />

          {/* Personal */}
          <Route path="/my-issues" element={<MyIssuesPage />} />
          <Route path="/inbox"     element={<InboxPage />} />
          <Route path="/calendar"  element={<CalendarPage />} />

          {/* Settings */}
          <Route path="/settings/members"      element={<MembersPage />} />
          <Route path="/settings/labels"       element={<div className="p-6 text-sm text-text-muted">Labels — coming soon</div>} />
          <Route path="/settings/automations"  element={<AutomationsPage />} />
          <Route path="/settings/org"          element={<OrgGeneralPage />} />
          <Route path="/settings/security"     element={<SecurityPage />} />
          <Route path="/settings/profile"      element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
