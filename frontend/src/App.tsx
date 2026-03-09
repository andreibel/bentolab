import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { AppLayout } from '@/components/layout/AppLayout'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import CreateOrgPage from '@/pages/org/CreateOrgPage'
import BoardListPage from '@/pages/board/BoardListPage'
import CalendarPage from '@/pages/CalendarPage'
import InboxPage from '@/pages/InboxPage'
import RoadmapPage from '@/pages/planning/RoadmapPage'
import SprintsPage from '@/pages/planning/SprintsPage'
import WorkloadPage from '@/pages/planning/WorkloadPage'
import ReportsPage from '@/pages/analytics/ReportsPage'
import TimeTrackingPage from '@/pages/analytics/TimeTrackingPage'
import AutomationsPage from '@/pages/settings/AutomationsPage'

const RTL_LANGS = ['he', 'ar', 'fa']

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  if (!accessToken && !refreshToken) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { i18n } = useTranslation()

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

        {/* Onboarding */}
        <Route path="/org/new" element={<ProtectedRoute><CreateOrgPage /></ProtectedRoute>} />

        {/* App shell */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          {/* Workspace */}
          <Route path="/boards"         element={<BoardListPage />} />
          <Route path="/calendar"       element={<CalendarPage />} />
          <Route path="/my-issues"      element={<div className="text-sm text-text-muted">My Issues — coming soon</div>} />
          <Route path="/inbox"          element={<InboxPage />} />

          {/* Planning */}
          <Route path="/roadmap"        element={<RoadmapPage />} />
          <Route path="/sprints"        element={<SprintsPage />} />
          <Route path="/workload"       element={<WorkloadPage />} />

          {/* Analytics */}
          <Route path="/reports"        element={<ReportsPage />} />
          <Route path="/time-tracking"  element={<TimeTrackingPage />} />

          {/* Organization */}
          <Route path="/settings/members"  element={<div className="text-sm text-text-muted">Members — coming soon</div>} />
          <Route path="/settings/labels"   element={<div className="text-sm text-text-muted">Labels — coming soon</div>} />
          <Route path="/automations"       element={<AutomationsPage />} />
          <Route path="/settings/org"      element={<div className="text-sm text-text-muted">Org Settings — coming soon</div>} />
          <Route path="/settings/profile"  element={<div className="text-sm text-text-muted">Profile — coming soon</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
