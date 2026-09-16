import type { LucideIcon } from 'lucide-react'
import type { WaitingItem as WaitingItemData } from '../../types/waiting.types'
import { ageBetween, formatShortDate, OVERDUE_AFTER_DAYS } from '../../utils/waiting'
import RailItem from '../common/RailItem'

export type AgeVerb = 'waiting' | 'quiet for' | 'merged'

interface WaitingItemProps {
  item: WaitingItemData
  /** When GitHub was checked; every age on the page is measured from it. */
  checkedAt: string
  icon: LucideIcon
  color: string
  /** How to read the age aloud: "waiting 6 days", "quiet for 38 days", "merged 3 days ago". */
  ageVerb: AgeVerb
  /** Only where a person is waiting does a long wait turn urgent. */
  canBeOverdue?: boolean
  muted?: boolean
}

export default function WaitingItem({ item, checkedAt, icon, color, ageVerb, canBeOverdue, muted }: WaitingItemProps) {
  const age = ageBetween(item.since, checkedAt)

  return (
    <RailItem
      dateTime={item.since}
      time={
        <>
          <span aria-hidden="true">{age.short}</span>
          <span className="visually-hidden">{ageVerb} {age.long}{ageVerb === 'merged' ? ' ago' : ''}</span>
        </>
      }
      overdue={canBeOverdue && age.days >= OVERDUE_AFTER_DAYS}
      icon={icon}
      color={color}
      muted={muted}
      href={item.url}
      summary={item.summary}
      meta={
        <>
          <span>{item.repo}</span>
          <span>
            {item.detail ?? `${ageVerb === 'merged' ? 'merged' : 'last activity'} ${formatShortDate(item.since, checkedAt)}`}
          </span>
        </>
      }
    />
  )
}
