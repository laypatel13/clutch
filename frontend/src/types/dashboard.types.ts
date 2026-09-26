export interface StreakSummary {
  current_streak: number
  longest_streak: number
  total_active_days: number
  /** False means current_streak runs through yesterday and needs a contribution today to continue. */
  active_today: boolean
}
