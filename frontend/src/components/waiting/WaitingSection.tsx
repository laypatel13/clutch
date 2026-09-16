import type { ReactNode } from 'react'

interface WaitingSectionProps {
  id: string
  title: string
  /** One line on why this section matters — the concept is new, so say it. */
  hint: string
  accent?: 'pink' | 'green' | 'orange' | 'purple'
  count: number
  children: ReactNode
}

/** A card like a timeline day: heading, count, then a rail of items. */
export default function WaitingSection({ id, title, hint, accent, count, children }: WaitingSectionProps) {
  const headingId = `waiting-${id}`

  return (
    <section
      className={`nb-card panel waiting-section${accent ? ` nb-accent-${accent}` : ''}`}
      aria-labelledby={headingId}
    >
      <div className="panel-header">
        <h2 id={headingId} className="timeline-day-title">{title}</h2>
        {count > 0 && <span className="tag tag-outline">{count}</span>}
      </div>
      <p className="waiting-hint">{hint}</p>
      {children}
    </section>
  )
}
