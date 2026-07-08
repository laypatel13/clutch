export interface DailyActivityEntry {
  date: string
  commits: number
  prs: number
}

export interface ActivitySummary {
  total_commits: number
  total_prs: number
  total_issues: number
  active_days: number
  daily_activity: DailyActivityEntry[]
}

export interface StreakSummary {
  current_streak: number
  longest_streak: number
  total_active_days: number
}

export interface HeatmapDay {
  date: string
  count: number
}

export interface HeatmapData {
  username: string
  total_contributions: number
  max_count: number
  days: HeatmapDay[]
}

export interface WeeklyInsightStats {
  total_commits: number
  total_prs: number
  active_days: number
  best_day: string
}

export interface WeeklyInsight {
  week_start: string
  stats: WeeklyInsightStats
  ai_summary: string
  generated_by: string
  message?: string
}

export interface LanguageDetail {
  bytes: number
  percentage: number
}

export type LanguageBreakdown = Record<string, LanguageDetail>

