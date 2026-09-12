import { Flame, BarChart3 } from 'lucide-react'
import StatCard from '../common/StatCard'
import type { StreakSummary } from '../../types/dashboard.types'

interface StatsGridProps {
  streak: StreakSummary | null
}

export default function StatsGrid({ streak }: StatsGridProps) {
  return (
    <div className="stats-grid">
      <StatCard label="streak" value={streak ? `${streak.current_streak}d` : '—'} icon={<Flame size={13} />} color="yellow" />
      <StatCard label="best streak" value={streak ? `${streak.longest_streak}d` : '—'} icon={<BarChart3 size={13} />} color="cyan" />
    </div>
  )
}
