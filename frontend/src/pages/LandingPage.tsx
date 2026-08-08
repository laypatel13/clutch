import { GitBranch, ArrowRight } from 'lucide-react'
import { useAuthentication } from '../hooks/useAuthentication'
import { Navigate } from 'react-router-dom'
import NavigationBar from '../components/layout/NavigationBar'
import { API_BASE_URL, GITHUB_REPOSITORY_URL } from '../constants/config.constants'

export default function LandingPage() {
  const { user } = useAuthentication()
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <NavigationBar rightContent={
        <>
          <a
            href={GITHUB_REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on GitHub"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-2)', border: '1px solid var(--text-primary)', borderRadius: '4px', color: 'var(--text-primary)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
          <a href={`${API_BASE_URL}/auth/github`} className="btn-nb btn-purple">
            <GitBranch size={13} /> Connect GitHub
          </a>
        </>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1px', background: 'var(--border)', border: '2px solid var(--border)', boxShadow: 'var(--shadow)', textAlign: 'left' }}>
            {[
              { label: 'access clutch in your terminal', value: 'Command Line Interface' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-card)', padding: 'var(--space-3) var(--space-4)' }}>
                <div style={{ fontFamily: 'var(--font-chrome)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>{s.value}</div>
                <div style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-5)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-panel)', border: '1px solid var(--border-light)' }}>
            $ pip install clutch-cli
          </div>
        </div>
      </main>

      <footer style={{ borderTop: '2px solid var(--border)', padding: 'var(--space-4) var(--space-8)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)', background: 'var(--bg-card)' }}>
        <span style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>© 2026 Clutch — MIT License</span>
        <a href={GITHUB_REPOSITORY_URL} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--accent-purple)', textDecoration: 'none' }}>Star on GitHub ★</a>
      </footer>
    </div>
  )
}
