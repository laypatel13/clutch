import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import type { PullRequestItem, PullRequestState } from '../../types/pulls.types'

interface PRListProps {
  pulls: PullRequestItem[]
}

type FilterTab = 'ALL' | PullRequestState

const STATE_TAG: Record<PullRequestState, string> = {
  OPEN: 'tag-green',
  MERGED: 'tag-purple',
  CLOSED: 'tag-outline',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PRList({ pulls }: PRListProps) {
  const [filter, setFilter] = useState<FilterTab>('ALL')

  const filtered = filter === 'ALL' ? pulls : pulls.filter(p => p.state === filter)
  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: `All · ${pulls.length}` },
    { key: 'OPEN', label: `Open · ${pulls.filter(p => p.state === 'OPEN').length}` },
    { key: 'MERGED', label: `Merged · ${pulls.filter(p => p.state === 'MERGED').length}` },
    { key: 'CLOSED', label: `Closed · ${pulls.filter(p => p.state === 'CLOSED').length}` },
  ]

  return (
    <div className="nb-card" style={{ padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <span className="section-label" style={{ marginBottom: 0 }}>All Pull Requests</span>
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
          No pull requests here — click Sync to load, or try a different filter.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {filtered.map(pr => (
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
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '2px' }}>
                  <span className={`tag ${STATE_TAG[pr.state]}`} style={{ fontSize: '10px' }}>{pr.state}</span>
                  {pr.is_draft && <span className="tag tag-outline" style={{ fontSize: '10px' }}>DRAFT</span>}
                  {!pr.is_own_repo && <span className="tag tag-outline" style={{ fontSize: '10px' }}>EXTERNAL</span>}
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pr.title}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {pr.repo} #{pr.pr_number} · +{pr.additions}/-{pr.deletions} · {formatDate(pr.created_at)}
                </div>
              </div>
              <ExternalLink size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
