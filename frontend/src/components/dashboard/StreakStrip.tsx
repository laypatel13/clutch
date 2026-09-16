import { useEffect, useState } from 'react'
import { Flame, Trophy, type LucideIcon } from 'lucide-react'
import httpClient from '../../api/httpClient'
import type { StreakSummary } from '../../types/dashboard.types'

/** Streak as a quiet line of context under the page heading — secondary to the timeline. */
export default function StreakStrip() {
  const [streak, setStreak] = useState<StreakSummary | null>(null)

  useEffect(() => {
    httpClient
      .get<StreakSummary>('/github/streak')
      .then(response => setStreak(response.data))
      // Deliberately silent: the streak is supporting context, and an error
      // message here would compete with the timeline, which has its own states.
      .catch(() => {})
  }, [])

  if (!streak) return null

  const { current_streak: current, longest_streak: best, active_today: activeToday } = streak
  const live = current > 0
  const days = (count: number) => (count === 1 ? 'day' : 'days')

  let currentLabel = 'start one today'
  let currentSpoken = 'No active streak. Contribute today to start one.'
  if (live && activeToday) {
    currentLabel = 'day streak'
    currentSpoken = `${current}-day streak, including today.`
  } else if (live) {
    currentLabel = 'day streak · commit today to keep it'
    currentSpoken = `${current}-day streak. Contribute today to keep it going.`
  }

  return (
    <ul className="streak-strip" aria-label="Contribution streak">
      <StreakStat icon={Flame} value={current} label={currentLabel} spoken={currentSpoken} live={live} />
      <StreakStat icon={Trophy} value={best} label="best" spoken={`Longest streak: ${best} ${days(best)}.`} />
    </ul>
  )
}

interface StreakStatProps {
  icon: LucideIcon
  value: number
  label: string
  /** The whole stat as one sentence, since the number and label are split visually. */
  spoken: string
  live?: boolean
}

function StreakStat({ icon: Icon, value, label, spoken, live }: StreakStatProps) {
  return (
    <li className={`streak-stat${live ? ' is-live' : ''}`}>
      <span className="timeline-marker streak-stat-marker" aria-hidden="true">
        <Icon size={12} strokeWidth={2.5} />
      </span>
      <span className="streak-stat-text" aria-hidden="true">
        <span className="streak-stat-number">{value}</span>
        <span className="streak-stat-label">{label}</span>
      </span>
      <span className="visually-hidden">{spoken}</span>
    </li>
  )
}
