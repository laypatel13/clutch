export type TimelineKind =
  | 'pull_request'
  | 'issue'
  | 'branch'
  | 'tag'
  | 'repository'
  | 'delete'
  | 'star'
  | 'fork'
  | 'release'

export interface TimelineCommit {
  sha: string
  message: string
  url: string
}

export interface TimelineItem {
  id: string
  kind: TimelineKind
  /** Headline key, e.g. 'merged', 'opened_and_merged', 'approved', 'pushed', 'starred'. */
  action: string
  /** A finished sentence, ready to display as-is. */
  summary: string
  title: string | null
  repo: string
  subject_number: number | null
  ref: string | null
  url: string
  /** UTC ISO timestamps. Grouping into days happens client-side, in local time. */
  started_at: string
  ended_at: string
  event_count: number
  is_private: boolean
  counts: Record<string, number>
  /** Newest first, capped server-side; `counts.commits` holds the true total. */
  commits: TimelineCommit[]
  repos?: string[]
}

export interface TimelinePage {
  items: TimelineItem[]
  next_cursor: string | null
}

export interface EventSyncResult {
  message: string
  new_events: number
  enriched: number
}
