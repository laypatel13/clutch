import { useState, useMemo, useEffect } from 'react'
import { ExternalLink, GitPullRequest, GitMerge, GitPullRequestClosed, GitPullRequestDraft, ChevronLeft, ChevronRight } from 'lucide-react'
import PanelHeader from '../common/PanelHeader'
import PRRow from './PRRow'
import type { PullRequestItem, PullRequestState } from '../../types/pulls.types'

interface PRListProps {
  pulls: PullRequestItem[]
}

type StatusFilter = 'ALL' | 'OPEN' | 'MERGED' | 'CLOSED' | 'DRAFT'
type RepoFilter = 'ALL' | 'INTERNAL' | 'EXTERNAL'

const PAGE_SIZE = 10

const STATE_ICON: Record<PullRequestState, { icon: typeof GitPullRequest; color: string; label: string }> = {
  OPEN: { icon: GitPullRequest, color: 'var(--accent-green-on-surface)', label: 'open' },
  MERGED: { icon: GitMerge, color: 'var(--accent-purple-on-surface)', label: 'merged' },
  CLOSED: { icon: GitPullRequestClosed, color: 'var(--accent-pink-on-surface)', label: 'closed' },
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'all statuses' },
  { value: 'OPEN', label: 'open' },
  { value: 'MERGED', label: 'merged' },
  { value: 'DRAFT', label: 'draft' },
  { value: 'CLOSED', label: 'closed' },
]

const REPO_OPTIONS: { value: RepoFilter; label: string }[] = [
  { value: 'ALL', label: 'all repositories' },
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
    <div className="nb-card nb-accent-orange panel">
      <PanelHeader
        label="all pull requests"
        trailing={
          <div className="pr-filters">
            <label className="visually-hidden" htmlFor="pr-status-filter">Filter by status</label>
            <select
              id="pr-status-filter"
              className="pr-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            >
              {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>

            <div className="chip-group">
              {REPO_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRepoFilter(opt.value)}
                  className="chip"
                  aria-pressed={repoFilter === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <p className="empty-state">
          No pull requests here — click Sync to load, or try different filters.
        </p>
      ) : (
        <>
          <div className="pr-row-list">
            {paged.map(pr => {
              const stateMeta = STATE_ICON[pr.state]
              const StateIcon = pr.is_draft ? GitPullRequestDraft : stateMeta.icon
              const stateColor = pr.is_draft ? 'var(--text-muted)' : stateMeta.color
              const stateLabel = pr.is_draft ? 'draft' : stateMeta.label
              return (
                <PRRow
                  key={`${pr.repo}#${pr.pr_number}`}
                  href={pr.url}
                  title={pr.title}
                  leading={<StateIcon size={15} color={stateColor} className="pr-row-state" aria-label={stateLabel} />}
                  titlePrefix={!pr.is_own_repo ? <span className="tag tag-outline pr-row-flag">external</span> : undefined}
                  meta={`${pr.repo} #${pr.pr_number} · +${pr.additions}/-${pr.deletions} · ${formatDate(pr.created_at)}`}
                  trailing={<ExternalLink size={12} color="var(--text-muted)" />}
                />
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="pr-pagination">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-nb btn-grey btn-sm"
              >
                <ChevronLeft size={13} /> previous
              </button>
              <span className="meta-mono">page {page + 1} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="btn-nb btn-grey btn-sm"
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
