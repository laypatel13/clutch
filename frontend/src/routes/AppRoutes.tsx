import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthentication } from '../hooks/useAuthentication'
import LandingPage from '../pages/LandingPage'
import DashboardPage from '../pages/DashboardPage'
import UserProfilePage from '../pages/UserProfilePage'
import PullsPage from '../pages/PullsPage'
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
        <Route path="/pulls" element={
          <PrivateRoute>
            <PullsPage />
          </PrivateRoute>
        } />
        <Route path="/u/:username" element={<UserProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
