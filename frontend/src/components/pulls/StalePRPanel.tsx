import { AlertTriangle, ExternalLink } from 'lucide-react'
import PanelHeader from '../common/PanelHeader'
import PRRow from './PRRow'
import type { StalePullRequest } from '../../types/pulls.types'

interface StalePRPanelProps {
  stalePrs: StalePullRequest[]
}

export default function StalePRPanel({ stalePrs }: StalePRPanelProps) {
  if (stalePrs.length === 0) return null

  return (
    <div className="nb-card nb-accent-pink panel">
      <PanelHeader
        leading={<AlertTriangle size={15} color="var(--accent-pink-on-surface)" />}
        label={`${stalePrs.length} pull request${stalePrs.length > 1 ? 's' : ''} need attention`}
        trailing={<span className="badge badge-pink">stale</span>}
      />
      <div className="pr-row-list">
        {stalePrs.map(pr => (
          <PRRow
            key={`${pr.repo}#${pr.pr_number}`}
            href={pr.url}
            title={pr.title}
            meta={`${pr.repo} #${pr.pr_number}`}
            filled
            trailing={
              <>
                <span className="tag tag-pink">{pr.days_open}d open</span>
                <ExternalLink size={12} color="var(--text-muted)" />
              </>
            }
          />
        ))}
      </div>
    </div>
  )
}
