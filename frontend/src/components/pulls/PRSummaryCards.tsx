import { Percent, Timer, Globe } from 'lucide-react'
import StatCard from '../common/StatCard'
import type { PullRequestSummary } from '../../types/pulls.types'

interface PRSummaryCardsProps {
  summary: PullRequestSummary | null
}

export default function PRSummaryCards({ summary }: PRSummaryCardsProps) {
  const mergeRate = summary?.merge_rate != null ? `${Math.round(summary.merge_rate * 100)}%` : '—'
  const timeToMerge = summary?.avg_time_to_merge_days != null ? `${summary.avg_time_to_merge_days}d` : '—'
  const external = summary ? summary.external_repo_count : '—'

  return (
    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(155px, 100%), 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
      <StatCard label="Merge Rate" value={mergeRate} icon={<Percent size={13} />} color="purple" />
      <StatCard label="Avg Time to Merge" value={timeToMerge} icon={<Timer size={13} />} color="cyan" />
      <StatCard label="External Repositories" value={external} icon={<Globe size={13} />} color="green" />
    </div>
  )
}