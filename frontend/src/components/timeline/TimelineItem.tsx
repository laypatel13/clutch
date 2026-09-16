import {
  CircleCheck,
  CircleDot,
  Eye,
  FolderGit2,
  GitBranch,
  GitCommitHorizontal,
  GitFork,
  GitMerge,
  GitPullRequest,
  GitPullRequestClosed,
  Lock,
  MessageSquare,
  Rocket,
  Star,
  Tag,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import type { TimelineItem as TimelineItemData } from '../../types/timeline.types'
import { formatTimeRange } from '../../utils/timeline'
import RailItem from '../common/RailItem'

interface Marker {
  Icon: LucideIcon
  color: string
}

const tone = (accent: string) => `var(--accent-${accent}-on-surface)`
const MUTED = 'var(--text-muted)'

// Background activity rather than work — shown, but quieter.
const MUTED_KINDS = new Set(['star', 'fork', 'delete'])

function markerFor(item: TimelineItemData): Marker {
  const { kind, action } = item
  if (kind === 'pull_request') {
    if (action === 'merged' || action === 'opened_and_merged') return { Icon: GitMerge, color: tone('purple') }
    if (action === 'closed' || action === 'opened_and_closed') return { Icon: GitPullRequestClosed, color: tone('pink') }
    if (action === 'opened' || action === 'reopened') return { Icon: GitPullRequest, color: tone('green') }
    if (action === 'approved') return { Icon: CircleCheck, color: tone('green') }
    if (action === 'changes_requested') return { Icon: Eye, color: tone('orange') }
    if (action === 'reviewed') return { Icon: Eye, color: tone('cyan') }
    return { Icon: MessageSquare, color: tone('cyan') }
  }
  if (kind === 'issue') {
    if (action === 'closed' || action === 'opened_and_closed') return { Icon: CircleCheck, color: tone('purple') }
    if (action === 'commented') return { Icon: MessageSquare, color: tone('cyan') }
    return { Icon: CircleDot, color: tone('green') }
  }
  if (kind === 'branch') {
    return action === 'created'
      ? { Icon: GitBranch, color: tone('orange') }
      : { Icon: GitCommitHorizontal, color: tone('orange') }
  }
  if (kind === 'tag') return { Icon: Tag, color: tone('yellow') }
  if (kind === 'repository') return { Icon: FolderGit2, color: tone('purple') }
  if (kind === 'release') return { Icon: Rocket, color: tone('purple') }
  if (kind === 'star') return { Icon: Star, color: MUTED }
  if (kind === 'fork') return { Icon: GitFork, color: MUTED }
  return { Icon: Trash2, color: MUTED }
}

const shortSha = (sha: string) => sha.slice(0, 7)

function CommitList({ item }: { item: TimelineItemData }) {
  const total = item.counts.commits ?? item.commits.length
  // A single commit's message is already in the summary line.
  if (total < 2) return null

  return (
    <details className="timeline-details">
      <summary>{total} commits</summary>
      <ol className="timeline-commits">
        {item.commits.map(commit => (
          <li key={commit.sha} className="timeline-commit">
            <a className="timeline-commit-sha" href={commit.url} target="_blank" rel="noopener noreferrer">
              {shortSha(commit.sha)}
              <span className="visually-hidden"> (opens on GitHub)</span>
            </a>
            <span className="timeline-commit-message">{commit.message}</span>
          </li>
        ))}
      </ol>
      {total > item.commits.length && (
        <a className="inline-link timeline-details-more" href={item.url} target="_blank" rel="noopener noreferrer">
          View all {total} commits on GitHub
        </a>
      )}
    </details>
  )
}

function StarredList({ item }: { item: TimelineItemData }) {
  const repos = item.repos ?? []
  // "Starred a and b" already names both.
  if (repos.length < 3) return null

  return (
    <details className="timeline-details">
      <summary>{repos.length} repositories</summary>
      <ul className="timeline-commits">
        {repos.map(repo => (
          <li key={repo} className="timeline-commit">
            <a className="inline-link" href={`https://github.com/${repo}`} target="_blank" rel="noopener noreferrer">
              {repo}
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}

export default function TimelineItem({ item }: { item: TimelineItemData }) {
  const { Icon, color } = markerFor(item)

  return (
    <RailItem
      dateTime={item.started_at}
      time={formatTimeRange(item.started_at, item.ended_at)}
      icon={Icon}
      color={color}
      muted={MUTED_KINDS.has(item.kind)}
      href={item.url}
      summary={item.summary}
      meta={
        <>
          <span>{item.repo}</span>
          {item.is_private && (
            <span className="timeline-private">
              <Lock size={10} aria-hidden="true" /> private
            </span>
          )}
        </>
      }
    >
      {item.kind === 'branch' && <CommitList item={item} />}
      {item.kind === 'star' && <StarredList item={item} />}
    </RailItem>
  )
}
