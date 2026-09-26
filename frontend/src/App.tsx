import { AuthenticationProvider } from './contexts/AuthenticationProvider'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return (
    <AuthenticationProvider>
      <AppRoutes />
    </AuthenticationProvider>
  )
}
