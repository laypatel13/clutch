import { Flame, BarChart3 } from 'lucide-react'
import StatCard from '../common/StatCard'
import type { StreakSummary } from '../../types/dashboard.types'

interface StatsGridProps {
  streak: StreakSummary | null
}

export default function StatsGrid({ streak }: StatsGridProps) {
  return (
    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(155px, 100%), 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
      <StatCard label="Streak" value={streak ? `${streak.current_streak}d` : '—'} icon={<Flame size={13} />} color="yellow" />
      <StatCard label="Best Streak" value={streak ? `${streak.longest_streak}d` : '—'} icon={<BarChart3 size={13} />} color="cyan" />
    </div>
  )
}