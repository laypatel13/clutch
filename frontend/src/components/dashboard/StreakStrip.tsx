import { useEffect, useState } from 'react'
import { Flame, Trophy } from 'lucide-react'
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

  return (
    <ul className="streak-strip" aria-label="Contribution streak">
      <li className="tag tag-outline">
        <Flame size={12} aria-hidden="true" />
        {streak.current_streak > 0 ? `${streak.current_streak}-day streak` : 'No active streak'}
      </li>
      <li className="tag tag-outline">
        <Trophy size={12} aria-hidden="true" />
        Best: {streak.longest_streak} {streak.longest_streak === 1 ? 'day' : 'days'}
      </li>
    </ul>
  )
}
