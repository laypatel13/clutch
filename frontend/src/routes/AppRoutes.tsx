import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthentication } from '../hooks/useAuthentication'
import LandingPage from '../pages/LandingPage'
import DashboardPage from '../pages/DashboardPage'
import UserProfilePage from '../pages/UserProfilePage'
import WaitingPage from '../pages/WaitingPage'
import AuthenticationCallbackPage from '../pages/AuthenticationCallbackPage'
import LoadingScreen from '../components/common/LoadingScreen'

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthentication()
  if (loading) return <LoadingScreen />
  return user ? <>{children}</> : <Navigate to="/" replace />
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/callback" element={<AuthenticationCallbackPage />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        } />
        <Route path="/waiting" element={
          <PrivateRoute>
            <WaitingPage />
          </PrivateRoute>
        } />
        {/* The page used to live here as "Pull Requests"; keep old links working. */}
        <Route path="/pulls" element={<Navigate to="/waiting" replace />} />
        <Route path="/u/:username" element={<UserProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
