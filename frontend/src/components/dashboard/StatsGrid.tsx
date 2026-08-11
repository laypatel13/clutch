import { GitCommit, GitPullRequest, Flame, BarChart3, Calendar } from 'lucide-react'
import StatCard from '../common/StatCard'
import type { ActivitySummary, StreakSummary } from '../../types/dashboard.types'

interface StatsGridProps {
  activity: ActivitySummary | null
  streak: StreakSummary | null
}

export default function StatsGrid({ activity, streak }: StatsGridProps) {
  return (
    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(155px, 100%), 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
      <StatCard label="Commits" value={activity?.total_commits ?? '—'} icon={<GitCommit size={13} />} color="purple" />
      <StatCard label="Pull Requests" value={activity?.total_prs ?? '—'} icon={<GitPullRequest size={13} />} color="pink" />
      <StatCard label="Streak" value={streak ? `${streak.current_streak}d` : '—'} icon={<Flame size={13} />} color="yellow" />
      <StatCard label="Best Streak" value={streak ? `${streak.longest_streak}d` : '—'} icon={<BarChart3 size={13} />} color="cyan" />
      <StatCard label="Active Days" value={streak?.total_active_days ?? '—'} icon={<Calendar size={13} />} color="green" />
    </div>
  )
}
