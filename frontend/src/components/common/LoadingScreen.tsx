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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 'var(--space-5)' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 'var(--text-3xl)', color: 'var(--text-primary)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
        Clutch<span className="blink" style={{ color: 'var(--accent-purple)' }}>_</span>
      </div>
      <div style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{message}</div>
    </div>
  )
}