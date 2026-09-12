import { useEffect } from 'react'

interface LoadingScreenProps { message?: string }

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  // Theme sync lives here too (not just NavigationBar) because this screen can
  // render completely standalone — e.g. PrivateRoute's auth-loading state and
  // AuthenticationCallbackPage never mount a NavigationBar at all. Without this,
  // a fresh page load on those routes ignores the saved dark-mode preference
  // until some other component happens to mount and apply it.
  useEffect(() => {
    const root = document.documentElement
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    root.setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light')
  }, [])

  return (
    <div className="centered-viewport">
      <div className="wordmark-lg">
        Clutch<span className="blink wordmark-cursor">_</span>
      </div>
      <div className="loading-message">{message}</div>
    </div>
  )
}
