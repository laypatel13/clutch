import type { WaitingResponse } from '../types/waiting.types'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

/** A person is waiting once it's been this long — the age turns urgent. */
export const OVERDUE_AFTER_DAYS = 7

export interface Age {
  /** Compact, for the rail's narrow column: "5h", "6d", "3mo". */
  short: string
  /** Spoken form, so screen readers don't read "6d" as "six d". */
  long: string
  days: number
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/** Measured against when GitHub was checked, so every age on the page agrees. */
export function ageBetween(since: string, reference: string): Age {
  const elapsed = Math.max(0, new Date(reference).getTime() - new Date(since).getTime())
  const days = Math.floor(elapsed / DAY)

  if (elapsed < HOUR) return { short: '<1h', long: 'less than an hour', days }
  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR)
    return { short: `${hours}h`, long: plural(hours, 'hour'), days }
  }
  if (days < 100) return { short: `${days}d`, long: plural(days, 'day'), days }
  const months = Math.floor(days / 30)
  return { short: `${months}mo`, long: plural(months, 'month'), days }
}

export function formatShortDate(iso: string, reference: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date(reference).getFullYear() ? undefined : 'numeric',
  })
}

/**
 * Open loops that need you. "Probably abandoned" and "awaiting a maintainer"
 * are shown, but not counted — neither is yours to close.
 */
export function countWaiting(response: WaitingResponse): number {
  const { review_requested, ready_to_merge, changes_requested, gone_quiet } = response.sections
  return review_requested.length + ready_to_merge.length + changes_requested.length + gone_quiet.length
}
