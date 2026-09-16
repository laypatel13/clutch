import { CircleCheck, CircleCheckBig, Clock, Eye, GitMerge, Hourglass, RotateCcw, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { WaitingState } from '../../hooks/useWaiting'
import type { WaitingItem as WaitingItemData, WaitingResponse, WaitingSectionKey } from '../../types/waiting.types'
import { countWaiting } from '../../utils/waiting'
import { RailSkeleton, SkeletonRegion } from '../common/Skeleton'
import StateMessage from '../common/StateMessage'
import WaitingItem, { type AgeVerb } from './WaitingItem'
import WaitingSection from './WaitingSection'

const tone = (accent: string) => `var(--accent-${accent}-on-surface)`

interface SectionConfig {
  key: Exclude<WaitingSectionKey, 'probably_abandoned'>
  title: string
  /** The title in a few words, for the all-clear line's chips. */
  shortTitle: string
  hint: string
  accent?: 'pink' | 'green' | 'orange' | 'purple'
  icon: LucideIcon
  color: string
  /** How the age reads aloud: "waiting 6 days", "quiet for 38 days", "merged 3 days ago". */
  ageVerb: AgeVerb
  /** Someone is blocked on you, so a long wait turns urgent rather than just old. */
  canBeOverdue: boolean
  /** A record rather than a check, so an empty one says nothing rather than "all clear". */
  hideWhenEmpty?: boolean
}

// In order of urgency — the same order the server classifies in.
const SECTIONS: SectionConfig[] = [
  {
    key: 'review_requested',
    title: 'Reviews requested from you',
    shortTitle: 'Reviews',
    hint: 'Someone is waiting on your review before they can move on.',
    accent: 'pink', icon: Eye, color: tone('pink'), ageVerb: 'waiting', canBeOverdue: true,
  },
  {
    key: 'ready_to_merge',
    title: 'Approved, ready to merge',
    shortTitle: 'Ready to merge',
    hint: 'Approved and yours to merge — one click from done.',
    accent: 'green', icon: GitMerge, color: tone('green'), ageVerb: 'waiting', canBeOverdue: true,
  },
  {
    key: 'changes_requested',
    title: 'Changes requested',
    shortTitle: 'Changes requested',
    hint: "A reviewer asked for changes you haven't pushed yet.",
    accent: 'orange', icon: RotateCcw, color: tone('orange'), ageVerb: 'waiting', canBeOverdue: true,
  },
  {
    key: 'gone_quiet',
    title: 'Gone quiet',
    shortTitle: 'Gone quiet',
    hint: 'No activity for over a week — worth a nudge, or closing.',
    icon: Hourglass, color: 'var(--text-muted)', ageVerb: 'quiet for', canBeOverdue: false,
  },
  {
    key: 'awaiting_maintainer',
    title: 'Approved, waiting on a maintainer',
    shortTitle: 'Waiting on a maintainer',
    hint: "Approved, but only the repository's maintainers can merge. Ping them if it sits.",
    icon: Clock, color: 'var(--text-muted)', ageVerb: 'waiting', canBeOverdue: false,
  },
  {
    // 30 days mirrors MERGED_WITHIN in backend/app/services/waiting.py.
    key: 'recently_merged',
    title: 'Merged in the last 30 days',
    shortTitle: 'Merged',
    hint: 'Loops you closed: your pull requests that landed recently.',
    accent: 'purple', icon: GitMerge, color: tone('purple'), ageVerb: 'merged', canBeOverdue: false,
    hideWhenEmpty: true,
  },
]

interface WaitingRailProps {
  items: WaitingItemData[]
  checkedAt: string
  config: SectionConfig
  muted?: boolean
}

function WaitingRail({ items, checkedAt, config, muted }: WaitingRailProps) {
  return (
    <ol className="timeline-list">
      {items.map(item => (
        <WaitingItem
          key={item.id}
          item={item}
          checkedAt={checkedAt}
          icon={config.icon}
          color={config.color}
          ageVerb={config.ageVerb}
          canBeOverdue={config.canBeOverdue}
          muted={muted}
        />
      ))}
    </ol>
  )
}

/** Checks that came back empty share one line: a single "all clear" and a chip per check. */
function ClearGroup({ sections }: { sections: SectionConfig[] }) {
  return (
    <section className="waiting-clear">
      <h2 className="waiting-clear-label">
        <CircleCheck size={16} strokeWidth={2.5} aria-hidden="true" /> All clear
      </h2>
      <ul className="waiting-clear-chips">
        {sections.map(({ key, title, shortTitle, icon: Icon, color }) => (
          <li key={key} className="waiting-clear-chip">
            <Icon size={13} strokeWidth={2.5} style={{ color }} aria-hidden="true" />
            <span aria-hidden="true">{shortTitle}</span>
            <span className="visually-hidden">{title}: none right now</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

type Block =
  | { type: 'section'; config: SectionConfig }
  | { type: 'clear'; sections: SectionConfig[] }

/**
 * Lays sections out in urgency order. Every check is always shown — hiding
 * empty ones made the page look like the other checks never ran — but runs
 * of consecutive empty sections share one compact group instead of each
 * taking a full card.
 */
function layOut(data: WaitingResponse): Block[] {
  const blocks: Block[] = []
  for (const config of SECTIONS) {
    // Gone quiet also hosts the collapsed "probably abandoned" group.
    const hasContent =
      data.sections[config.key].length > 0 ||
      (config.key === 'gone_quiet' && data.sections.probably_abandoned.length > 0)

    const last = blocks[blocks.length - 1]
    if (!hasContent && config.hideWhenEmpty) continue
    if (hasContent) blocks.push({ type: 'section', config })
    else if (last?.type === 'clear') last.sections.push(config)
    else blocks.push({ type: 'clear', sections: [config] })
  }
  return blocks
}

export default function Waiting({ waiting }: { waiting: WaitingState }) {
  const { data, status, refreshFailed, announcement, refresh, retry } = waiting

  let body
  if (status === 'loading') {
    body = (
      <SkeletonRegion label="Checking GitHub for what's waiting on you">
        <RailSkeleton />
      </SkeletonRegion>
    )
  } else if (!data) {
    body = (
      <StateMessage
        alert
        title="Couldn't check what's waiting on you"
        text="Clutch couldn't reach GitHub just now. Check your connection, then try again."
        action={{ label: 'Try again', onClick: retry }}
      />
    )
  } else {
    const abandoned = data.sections.probably_abandoned

    body = (
      <>
        {refreshFailed && (
          <div className="timeline-notice" role="alert">
            <TriangleAlert size={16} aria-hidden="true" className="timeline-notice-icon" />
            <p>Couldn't refresh from GitHub, so this list may be out of date.</p>
            <button type="button" className="btn-nb btn-ghost btn-sm" onClick={refresh}>
              Try again
            </button>
          </div>
        )}

        {countWaiting(data) === 0 && (
          <StateMessage
            icon={<CircleCheckBig size={28} />}
            title="Nothing's waiting on you"
            text="Every check below came back clear."
            action={{ label: 'Check again', onClick: refresh }}
          />
        )}

        <div className="timeline-days stagger-in">
          {layOut(data).map(block => {
            if (block.type === 'clear') {
              return <ClearGroup key={block.sections.map(s => s.key).join('-')} sections={block.sections} />
            }
            const { config } = block
            const items = data.sections[config.key]
            return (
              <WaitingSection
                key={config.key}
                id={config.key}
                title={config.title}
                hint={config.hint}
                accent={config.accent}
                count={items.length}
              >
                {items.length > 0 && <WaitingRail items={items} checkedAt={data.checked_at} config={config} />}
                {config.key === 'gone_quiet' && abandoned.length > 0 && (
                  <details className="timeline-details waiting-abandoned">
                    {/* 60 days mirrors ABANDONED_AFTER in backend/app/services/waiting.py. */}
                    <summary>
                      {abandoned.length} {abandoned.length === 1 ? 'PR' : 'PRs'} quiet for over 60 days — probably abandoned
                    </summary>
                    <WaitingRail items={abandoned} checkedAt={data.checked_at} config={config} muted />
                  </details>
                )}
              </WaitingSection>
            )
          })}
        </div>
      </>
    )
  }

  return (
    <section className="timeline" aria-label="What's waiting on you">
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      {body}
    </section>
  )
}
