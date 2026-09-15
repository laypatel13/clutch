import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface RailItemProps {
  /** Machine-readable timestamp for the left column's <time>. */
  dateTime: string
  /** What the left column shows — a clock time on Today, an age on Waiting. */
  time: ReactNode
  /** Emphasises the left column when something has waited too long. */
  overdue?: boolean
  icon: LucideIcon
  color: string
  muted?: boolean
  href: string
  summary: string
  meta: ReactNode
  children?: ReactNode
}

/**
 * One line on a vertical rail: time, marker, a sentence linking to GitHub, and
 * a meta line. Shared by Today and Waiting so both pages read as one product —
 * each maps its own data onto this rather than duplicating the markup.
 */
export default function RailItem({
  dateTime, time, overdue, icon: Icon, color, muted, href, summary, meta, children,
}: RailItemProps) {
  return (
    <li className="timeline-item" data-muted={muted ? 'true' : undefined}>
      <time className="timeline-time meta-mono" dateTime={dateTime} data-overdue={overdue ? 'true' : undefined}>
        {time}
      </time>

      <div className="timeline-rail">
        {/* Decorative: the summary sentence already says what this is. */}
        <span className="timeline-marker" style={{ color }} aria-hidden="true">
          <Icon size={12} strokeWidth={2.5} />
        </span>
      </div>

      <div className="timeline-body">
        <a className="timeline-summary" href={href} target="_blank" rel="noopener noreferrer">
          {summary}
          <span className="visually-hidden"> (opens on GitHub)</span>
        </a>
        <div className="timeline-meta meta-mono">{meta}</div>
        {children}
      </div>
    </li>
  )
}
