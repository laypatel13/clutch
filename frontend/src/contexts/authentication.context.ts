import { createContext } from 'react'
import type { AuthenticationContextValue } from '../types/user.types'

export const AuthenticationContext = createContext<AuthenticationContextValue | null>(null)
