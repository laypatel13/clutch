import { useState, useMemo, useEffect } from 'react'
import { ExternalLink, GitPullRequest, GitMerge, GitPullRequestClosed, GitPullRequestDraft, ChevronLeft, ChevronRight } from 'lucide-react'
import type { PullRequestItem, PullRequestState } from '../../types/pulls.types'

interface PRListProps {
  pulls: PullRequestItem[]
}

type StatusFilter = 'ALL' | 'OPEN' | 'MERGED' | 'CLOSED' | 'DRAFT'
type RepoFilter = 'ALL' | 'INTERNAL' | 'EXTERNAL'

const PAGE_SIZE = 10

const STATE_ICON: Record<PullRequestState, { icon: typeof GitPullRequest; color: string; label: string }> = {
  OPEN: { icon: GitPullRequest, color: 'var(--accent-green)', label: 'open' },
  MERGED: { icon: GitMerge, color: 'var(--accent-purple)', label: 'merged' },
  CLOSED: { icon: GitPullRequestClosed, color: 'var(--accent-pink)', label: 'closed' },
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'all statuses' },
  { value: 'OPEN', label: 'open' },
  { value: 'MERGED', label: 'merged' },
  { value: 'DRAFT', label: 'draft' },
  { value: 'CLOSED', label: 'closed' },
]

const REPO_OPTIONS: { value: RepoFilter; label: string }[] = [
  { value: 'ALL', label: 'all repos' },
  { value: 'INTERNAL', label: 'internal' },
  { value: 'EXTERNAL', label: 'external' },
]

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function matchesStatus(pr: PullRequestItem, filter: StatusFilter): boolean {
  if (filter === 'ALL') return true
  if (filter === 'DRAFT') return pr.is_draft
  if (filter === 'OPEN') return pr.state === 'OPEN' && !pr.is_draft
  return pr.state === filter
}

function matchesRepo(pr: PullRequestItem, filter: RepoFilter): boolean {
  if (filter === 'ALL') return true
  return filter === 'INTERNAL' ? pr.is_own_repo : !pr.is_own_repo
}

export default function PRList({ pulls }: PRListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [repoFilter, setRepoFilter] = useState<RepoFilter>('ALL')
  const [page, setPage] = useState(0)

  const filtered = useMemo(
    () => pulls.filter(p => matchesStatus(p, statusFilter) && matchesRepo(p, repoFilter)),
    [pulls, statusFilter, repoFilter]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  // Reset to page 1 whenever the filters change, so we never get stuck on an
  // out-of-range page from a previous, larger result set.
  useEffect(() => { setPage(0) }, [statusFilter, repoFilter])

  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="nb-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <span className="section-label" style={{ marginBottom: 0 }}>all pull requests</span>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            style={{
              fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-xs)', fontWeight: 500,
              color: 'var(--text-primary)', background: 'var(--bg-card)',
              border: '1px solid var(--border-light)', padding: '5px var(--space-3)',
              cursor: 'pointer', outline: 'none',
            }}
          >
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <div style={{ display: 'flex', gap: '2px' }}>
            {REPO_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRepoFilter(opt.value)}
                className={`tag ${repoFilter === opt.value ? 'tag-purple' : 'tag-outline'}`}
                style={{ cursor: 'pointer', border: repoFilter === opt.value ? undefined : '1px solid var(--border-light)' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-8) 0' }}>
          No pull requests here — click Sync to load, or try different filters.
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {paged.map(pr => {
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

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-5)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--border-light)' }}>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-nb btn-grey"
                style={{ fontSize: 'var(--text-sm)', padding: '5px var(--space-3)', opacity: page === 0 ? 0.4 : 1, cursor: page === 0 ? 'default' : 'pointer' }}
              >
                <ChevronLeft size={13} /> previous
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="btn-nb btn-grey"
                style={{ fontSize: 'var(--text-sm)', padding: '5px var(--space-3)', opacity: page >= totalPages - 1 ? 0.4 : 1, cursor: page >= totalPages - 1 ? 'default' : 'pointer' }}
              >
                next <ChevronRight size={13} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}