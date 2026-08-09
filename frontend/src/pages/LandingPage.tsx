import { GitBranch, ArrowRight } from 'lucide-react'
import { useAuthentication } from '../hooks/useAuthentication'
import { Navigate } from 'react-router-dom'
import NavigationBar from '../components/layout/NavigationBar'
import { API_BASE_URL, GITHUB_REPOSITORY_URL } from '../constants/config.constants'

export default function LandingPage() {
  const { user } = useAuthentication()
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavigationBar rightContent={
        <a href={`${API_BASE_URL}/auth/github`} className="btn-nb btn-purple">
          <GitBranch size={13} /> Connect GitHub
        </a>
      } />

      <main className="page-container" style={{ flex: 1, maxWidth: '640px', margin: '0 auto', width: '100%', padding: 'var(--space-18) var(--space-8) var(--space-14)' }}>

        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 'var(--space-5)', display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
            <span className="tag tag-purple">Open Source</span>
            <span className="tag tag-outline">Free Forever</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'var(--text-6xl)', lineHeight: 'var(--leading-tight)', letterSpacing: '0.01em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
            Track Your Developer 
          </h1>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'var(--text-6xl)', lineHeight: 'var(--leading-tight)', letterSpacing: '0.01em', textTransform: 'uppercase', color: 'var(--accent-pink)', marginBottom: 'var(--space-6)' }}>
            Momentum.
          </h1>

          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: 'var(--text-md)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-8)', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            Lower the friction between developer and their personal growth.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-8)', justifyContent: 'center' }}>
            <a
              href={`${API_BASE_URL}/auth/github`}
              className="btn-nb btn-dark"
              style={{ fontSize: 'var(--text-md)', padding: 'var(--space-4) var(--space-6)' }}
            >
              <GitBranch size={16} /> Get Started <ArrowRight size={15} />
            </a>
          </div>

          {/* MINI STAT ROW */}
          <a
            href="https://pypi.org/project/clutch-cli/"
            target="_blank"
            rel="noopener noreferrer"
            className="nb-card"
            style={{ display: 'block', textDecoration: 'none', textAlign: 'left', padding: 'var(--space-3) var(--space-4)' }}
          >
            <div style={{ fontFamily: 'var(--font-chrome)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>Command Line Interface</div>
            <div style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Access Clutch in your terminal Checkout on Python Pakage Index</div>
          </a>

          <div style={{ marginTop: 'var(--space-5)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-panel)', border: '1px solid var(--border-light)' }}>
            $ pip install clutch-cli
          </div>
        </div>
      </main>

      <footer className="blur-fade-in-delay" style={{ borderTop: '2px solid var(--border)', padding: 'var(--space-4) var(--space-8)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)', background: 'var(--bg-card)' }}>
        <span style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>© 2026 Clutch — MIT License</span>
        <a href={GITHUB_REPOSITORY_URL} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--accent-purple)', textDecoration: 'none' }}>Star on GitHub ★</a>
      </footer>
    </div>
  )
}