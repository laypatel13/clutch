import { useMemo } from 'react'
import { History, RefreshCw, TriangleAlert } from 'lucide-react'
import type { TimelineState } from '../../hooks/useTimeline'
import { groupByLocalDay, localDayKey, type TimelineDayGroup } from '../../utils/timeline'
import { Skeleton, SkeletonRegion } from '../common/Skeleton'
import TimelineDay from './TimelineDay'

function TimelineSkeleton() {
  return (
    <div className="nb-card panel">
      <div className="panel-header">
        <Skeleton width="96px" height="var(--text-xl)" />
        <Skeleton width="64px" height="var(--text-lg)" />
      </div>
      <div className="timeline-skeleton-rows">
        {[72, 58, 84, 64].map(width => (
          <div key={width} className="timeline-skeleton-row">
            <Skeleton width="3.5rem" height="var(--text-xs)" />
            <Skeleton width="1.5rem" height="1.5rem" />
            <Skeleton width={`${width}%`} height="var(--text-base)" />
          </div>
        ))}
      </div>
    </div>
  )
}

interface StateMessageProps {
  title: string
  text: string
  action?: { label: string; onClick: () => void }
  alert?: boolean
}

function StateMessage({ title, text, action, alert }: StateMessageProps) {
  return (
    <div className="nb-card panel timeline-state" role={alert ? 'alert' : undefined}>
      <h2 className="timeline-state-title">{title}</h2>
      <p className="timeline-state-text">{text}</p>
      {action && (
        <button type="button" className="btn-nb btn-purple" onClick={action.onClick}>
          <RefreshCw size={14} aria-hidden="true" /> {action.label}
        </button>
      )}
    </div>
  )
}

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
        <TimelineSkeleton />
      </SkeletonRegion>
    )
  } else if (items.length === 0 && syncing) {
    body = (
      <SkeletonRegion label="Syncing your activity from GitHub">
        <p className="timeline-first-sync meta-text">
          Pulling in your recent GitHub activity. The first sync can take a few seconds.
        </p>
        <TimelineSkeleton />
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
