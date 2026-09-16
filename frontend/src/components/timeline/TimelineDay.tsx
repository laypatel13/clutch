import type { TimelineDayGroup } from '../../utils/timeline'
import TimelineItem from './TimelineItem'

interface TimelineDayProps {
  day: TimelineDayGroup
  isToday: boolean
}

export default function TimelineDay({ day, isToday }: TimelineDayProps) {
  const headingId = `timeline-day-${day.key}`
  const count = day.items.length

  return (
    <section
      className={`nb-card panel timeline-day${isToday ? ' nb-accent-purple' : ''}`}
      aria-labelledby={headingId}
    >
      <div className="panel-header">
        <h2 id={headingId} className="timeline-day-title">
          <time dateTime={day.key}>{day.label}</time>
        </h2>
        {count > 0 && <span className="tag tag-outline">{count} {count === 1 ? 'thing' : 'things'}</span>}
      </div>

      {count > 0 ? (
        <ol className="timeline-list">
          {day.items.map(item => <TimelineItem key={item.id} item={item} />)}
        </ol>
      ) : (
        <p className="timeline-day-empty">
          Nothing yet today. Your work shows up here as you push, open pull requests and review.
        </p>
      )}
    </section>
  )
}
