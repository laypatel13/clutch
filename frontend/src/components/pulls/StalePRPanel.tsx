import { AlertTriangle, ExternalLink } from 'lucide-react'
import type { StalePullRequest } from '../../types/pulls.types'

interface StalePRPanelProps {
  stalePrs: StalePullRequest[]
}

export default function StalePRPanel({ stalePrs }: StalePRPanelProps) {
  if (stalePrs.length === 0) return null

  return (
    <div className="nb-panel-pink" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <AlertTriangle size={15} color="var(--accent-pink)" />
        <span className="section-label" style={{ marginBottom: 0 }}>
          {stalePrs.length} pull request{stalePrs.length > 1 ? 's' : ''} need attention
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {stalePrs.map(pr => (
          <a
            key={`${pr.repo}#${pr.pr_number}`}
            href={pr.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: 'var(--space-3)', padding: 'var(--space-3)', textDecoration: 'none',
              border: '1px solid var(--border-light)', background: 'var(--bg-card)',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pr.title}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {pr.repo} #{pr.pr_number}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
              <span className="tag tag-pink">{pr.days_open}d open</span>
              <ExternalLink size={12} color="var(--text-muted)" />
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}