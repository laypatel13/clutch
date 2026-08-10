import { ArrowRight } from 'lucide-react'

interface DashboardHeaderProps {
  name?: string | null
  username?: string
}

export default function DashboardHeader({ name, username }: DashboardHeaderProps) {
  return (
    <div style={{ marginBottom: 'var(--space-8)', paddingBottom: 'var(--space-6)', borderBottom: '2px solid var(--border)' }}>
      <div className="section-label">Dashboard</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 'var(--text-4xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)', letterSpacing: '0.01em' }}>
        {name || username}
      </h1>
      <div style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
        @{username} · Last 30 days ·{' '}
        <a href={`/u/${username}`} style={{ color: 'var(--accent-purple)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Public profile <ArrowRight size={13} /></a>
      </div>
    </div>
  )
}
