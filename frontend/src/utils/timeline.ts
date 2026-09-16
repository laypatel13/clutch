import type { TimelineItem, TimelinePage } from '../types/timeline.types'

export interface TimelineDayGroup {
  /** Local calendar date, YYYY-MM-DD — also valid for <time dateTime>. */
  key: string
  label: string
  items: TimelineItem[]
}

const pad = (value: number) => String(value).padStart(2, '0')

/** The viewer's local calendar date. The API sends UTC; "today" only means something locally. */
export function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function dayLabel(key: string, now: Date = new Date()): string {
  const [year, month, day] = key.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)

  if (key === localDayKey(now)) return 'Today'
  if (key === localDayKey(yesterday)) return 'Yesterday'
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: year === now.getFullYear() ? undefined : 'numeric',
  })
}

/** Groups items (already newest first) into local days, preserving order. */
export function groupByLocalDay(items: TimelineItem[], now: Date = new Date()): TimelineDayGroup[] {
  const groups: TimelineDayGroup[] = []
  for (const item of items) {
    const key = localDayKey(new Date(item.started_at))
    const current = groups[groups.length - 1]
    if (current?.key === key) {
      current.items.push(item)
    } else {
      groups.push({ key, label: dayLabel(key, now), items: [item] })
    }
  }
  return groups
}

const formatTime = (date: Date) => date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

/**
 * "03:39", or "03:17–03:34" for a session. A range is only shown when the
 * minutes differ — opening and merging a PR 20 seconds apart is one moment.
 */
export function formatTimeRange(startedAt: string, endedAt: string): string {
  const start = new Date(startedAt)
  const end = new Date(endedAt)
  const sameMinute = Math.floor(start.getTime() / 60000) === Math.floor(end.getTime() / 60000)
  return sameMinute ? formatTime(start) : `${formatTime(start)}–${formatTime(end)}`
}

export interface TimelineFeed {
  items: TimelineItem[]
  nextCursor: string | null
}

/**
 * Folds a freshly fetched first page into what's already on screen.
 *
 * After a sync the newest page is fetched again, but the viewer may already
 * have loaded earlier pages. Replacing everything would throw those away; so
 * the fresh page replaces the newest items, and previously loaded items older
 * than it are kept along with the cursor that continues past them.
 */
export function mergeFreshFirstPage(previous: TimelineFeed, fresh: TimelinePage): TimelineFeed {
  const freshItems = fresh.items
  const oldestFresh = freshItems[freshItems.length - 1]
  if (!oldestFresh || fresh.next_cursor === null) {
    return { items: freshItems, nextCursor: fresh.next_cursor }
  }

  const freshIds = new Set(freshItems.map(item => item.id))
  // Items are complete sessions with stable IDs, so anything not in the fresh
  // page that starts no later than its oldest item is genuinely older.
  const older = previous.items.filter(
    item => !freshIds.has(item.id) && item.started_at <= oldestFresh.started_at,
  )

  return older.length > 0
    ? { items: [...freshItems, ...older], nextCursor: previous.nextCursor }
    : { items: freshItems, nextCursor: fresh.next_cursor }
}
