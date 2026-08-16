import { useState } from 'react'
import { ExternalLink, GitPullRequest, GitMerge, GitPullRequestClosed, GitPullRequestDraft } from 'lucide-react'
import type { PullRequestItem, PullRequestState } from '../../types/pulls.types'

interface PRListProps {
  pulls: PullRequestItem[]
}

type FilterTab = 'ALL' | PullRequestState

const STATE_ICON: Record<PullRequestState, { icon: typeof GitPullRequest; color: string; label: string }> = {
  OPEN: { icon: GitPullRequest, color: 'var(--accent-green)', label: 'open' },
  MERGED: { icon: GitMerge, color: 'var(--accent-purple)', label: 'merged' },
  CLOSED: { icon: GitPullRequestClosed, color: 'var(--accent-pink)', label: 'closed' },
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PRList({ pulls }: PRListProps) {
  const [filter, setFilter] = useState<FilterTab>('ALL')

  const filtered = filter === 'ALL' ? pulls : pulls.filter(p => p.state === filter)
  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: `all · ${pulls.length}` },
    { key: 'OPEN', label: `open · ${pulls.filter(p => p.state === 'OPEN').length}` },
    { key: 'MERGED', label: `merged · ${pulls.filter(p => p.state === 'MERGED').length}` },
    { key: 'CLOSED', label: `closed · ${pulls.filter(p => p.state === 'CLOSED').length}` },
  ]

  return (
    <div className="nb-card" style={{ padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <span className="section-label" style={{ marginBottom: 0 }}>all pull requests</span>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`tag ${filter === tab.key ? 'tag-purple' : 'tag-outline'}`}
              style={{ cursor: 'pointer', border: filter === tab.key ? undefined : '1px solid var(--border-light)' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-8) 0' }}>
          No pull requests here — click sync to load, or try a different filter.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {filtered.map(pr => {
            const stateMeta = STATE_ICON[pr.state]
            const StateIcon = pr.is_draft ? GitPullRequestDraft : stateMeta.icon
            const stateColor = pr.is_draft ? 'var(--text-muted)' : stateMeta.color
            const stateLabel = pr.is_draft ? 'draft' : stateMeta.label
            return (
              <a
                key={`${pr.repo}#${pr.pr_number}`}
                href={pr.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: 'var(--space-3)', padding: 'var(--space-3)', textDecoration: 'none',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', minWidth: 0, flex: 1 }}>
                  <StateIcon size={15} color={stateColor} style={{ flexShrink: 0, marginTop: '2px' }} aria-label={stateLabel} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '2px' }}>
                      {!pr.is_own_repo && <span className="tag tag-outline" style={{ fontSize: '10px' }}>external</span>}
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pr.title}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {pr.repo} #{pr.pr_number} · +{pr.additions}/-{pr.deletions} · {formatDate(pr.created_at)}
                    </div>
                  </div>
                </div>
                <ExternalLink size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}