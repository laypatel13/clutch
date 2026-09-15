import { useMemo } from 'react'
import { History, TriangleAlert } from 'lucide-react'
import type { TimelineState } from '../../hooks/useTimeline'
import { groupByLocalDay, localDayKey, type TimelineDayGroup } from '../../utils/timeline'
import { RailSkeleton, SkeletonRegion } from '../common/Skeleton'
import StateMessage from '../common/StateMessage'
import TimelineDay from './TimelineDay'

export default function Timeline({ timeline }: { timeline: TimelineState }) {
  const {
    items, hasEarlier, status, loadingEarlier, earlierFailed,
    syncing, syncFailed, announcement, sync, retry, loadEarlier,
  } = timeline

  const days = useMemo<TimelineDayGroup[]>(() => {
    const grouped = groupByLocalDay(items)
    // Always lead with today, even when it's empty, so the page answers
    // "what have I done today?" instead of silently opening on yesterday.
    const todayKey = localDayKey(new Date())
    if (grouped.length > 0 && grouped[0].key !== todayKey) {
      grouped.unshift({ key: todayKey, label: 'Today', items: [] })
    }
    return grouped
  }, [items])

  const todayKey = localDayKey(new Date())

  let body
  if (status === 'loading') {
    body = (
      <SkeletonRegion label="Loading your activity">
        <RailSkeleton />
      </SkeletonRegion>
    )
  } else if (items.length === 0 && syncing) {
    body = (
      <SkeletonRegion label="Syncing your activity from GitHub">
        <p className="timeline-first-sync meta-text">
          Pulling in your recent GitHub activity. The first sync can take a few seconds.
        </p>
        <RailSkeleton />
      </SkeletonRegion>
    )
  } else if (items.length === 0 && (status === 'error' || syncFailed)) {
    body = (
      <StateMessage
        alert
        title="Couldn't load your activity"
        text="Clutch couldn't reach GitHub or its own server just now. Check your connection, then try again."
        action={{ label: 'Try again', onClick: retry }}
      />
    )
  } else if (items.length === 0) {
    body = (
      <StateMessage
        title="No activity yet"
        text="When you push commits, open pull requests or review someone's work on GitHub, it shows up here — grouped into what you actually did."
        action={{ label: 'Sync now', onClick: sync }}
      />
    )
  } else {
    body = (
      <>
        {syncFailed && (
          <div className="timeline-notice" role="alert">
            <TriangleAlert size={16} aria-hidden="true" className="timeline-notice-icon" />
            <p>Couldn't refresh from GitHub, so your most recent work may be missing.</p>
            <button type="button" className="btn-nb btn-ghost btn-sm" onClick={sync}>
              Try again
            </button>
          </div>
        )}

        <div className="timeline-days stagger-in">
          {days.map(day => <TimelineDay key={day.key} day={day} isToday={day.key === todayKey} />)}
        </div>

        {hasEarlier ? (
          <div className="timeline-more">
            {earlierFailed && <p className="meta-text">Couldn't load earlier activity.</p>}
            <button type="button" className="btn-nb btn-ghost" onClick={loadEarlier} disabled={loadingEarlier}>
              <History size={14} aria-hidden="true" />
              {loadingEarlier ? 'Loading…' : earlierFailed ? 'Try again' : 'Load earlier activity'}
            </button>
          </div>
        ) : (
          <p className="timeline-end meta-text">
            That's everything synced. GitHub only keeps about 90 days of activity.
          </p>
        )}
      </>
    )
  }

  return (
    <section className="timeline" aria-label="Activity timeline">
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      {body}
    </section>
  )
}
