export type WaitingSectionKey =
  | 'review_requested'
  | 'ready_to_merge'
  | 'changes_requested'
  | 'gone_quiet'
  | 'probably_abandoned'
  | 'awaiting_maintainer'

export interface WaitingItem {
  /** "owner/repo#number" — unique across sections. */
  id: string
  repo: string
  number: number
  title: string | null
  url: string
  /** An imperative sentence — the next thing to do — ready to display as-is. */
  summary: string
  /** "approved by bob", "opened by alice"; null when there's no one to name. */
  detail: string | null
  /** UTC ISO timestamp the loop started waiting. */
  since: string
}

export interface WaitingResponse {
  checked_at: string
  sections: Record<WaitingSectionKey, WaitingItem[]>
}
