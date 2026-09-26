import { useContext } from 'react'
import { AuthenticationContext } from '../contexts/authentication.context'

export function useAuthentication() {
  const context = useContext(AuthenticationContext)
  if (!context) throw new Error('useAuthentication must be used within AuthenticationProvider')
  return context
}
