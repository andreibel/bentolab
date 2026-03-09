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

        {/* Onboarding — protected but no app shell */}
        <Route
          path="/org/new"
          element={
            <ProtectedRoute>
              <CreateOrgPage />
            </ProtectedRoute>
          }
        />

        {/* App — protected, inside the shell */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/boards" element={<BoardListPage />} />
          <Route path="/my-issues" element={<div className="text-sm text-text-muted">My Issues — coming soon</div>} />
          <Route path="/settings/members" element={<div className="text-sm text-text-muted">Members — coming soon</div>} />
          <Route path="/settings/org" element={<div className="text-sm text-text-muted">Org Settings — coming soon</div>} />
          <Route path="/settings/profile" element={<div className="text-sm text-text-muted">Profile — coming soon</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
