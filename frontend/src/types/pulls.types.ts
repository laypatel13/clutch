export type PullRequestState = 'OPEN' | 'MERGED' | 'CLOSED'

export interface PullRequestItem {
  repo: string
  pr_number: number
  title: string
  url: string
  state: PullRequestState
  is_draft: boolean
  is_own_repo: boolean
  additions: number
  deletions: number
  changed_files: number
  review_count: number
  created_at: string
  merged_at: string | null
  closed_at: string | null
}

export interface StalePullRequest {
  repo: string
  pr_number: number
  title: string
  url: string
  days_open: number
}

export interface PRSizeDistribution {
  small: number
  medium: number
  large: number
}

export interface PullRequestSummary {
  total_prs: number
  merge_rate: number | null
  avg_time_to_merge_days: number | null
  size_distribution: PRSizeDistribution
  own_repo_count: number
  external_repo_count: number
  stale_prs: StalePullRequest[]
}
