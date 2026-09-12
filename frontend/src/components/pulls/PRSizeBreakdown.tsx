import PanelHeader from '../common/PanelHeader'
import type { PRSizeDistribution } from '../../types/pulls.types'

interface PRSizeBreakdownProps {
  distribution: PRSizeDistribution
}

const SEGMENTS: { key: keyof PRSizeDistribution; label: string; color: string }[] = [
  { key: 'small', label: 'Small (<50 lines)', color: 'var(--accent-orange)' },
  { key: 'medium', label: 'Medium (50-300)', color: 'var(--accent-purple)' },
  { key: 'large', label: 'Large (300+)', color: 'var(--accent-pink)' },
]

export default function PRSizeBreakdown({ distribution }: PRSizeBreakdownProps) {
  const total = distribution.small + distribution.medium + distribution.large
  const segments = SEGMENTS
    .map(seg => ({ ...seg, count: distribution[seg.key] }))
    .filter(s => s.count > 0)

  return (
    <div className="nb-card nb-accent-cyan panel">
      <PanelHeader
        label="pull request size mix"
        trailing={<span className="tag tag-outline">{total} total</span>}
      />
      {total === 0 ? (
        <p className="empty-state">No synced pull requests yet.</p>
      ) : (
        <div>
          <div className="size-bar">
            {segments.map((seg, idx) => {
              const pct = (seg.count / total) * 100
              return (
                <div
                  key={seg.key}
                  className="size-bar-segment"
                  title={`${seg.label} · ${seg.count} (${Math.round(pct)}%)`}
                  style={{
                    width: `${pct}%`,
                    background: seg.color,
                    borderRight: idx < segments.length - 1 ? '2px solid var(--bg-panel)' : 'none',
                  }}
                />
              )
            })}
          </div>

          <div className="size-legend">
            {SEGMENTS.map(seg => {
              const count = distribution[seg.key]
              if (count === 0) return null
              const pct = Math.round((count / total) * 100)
              return (
                <div key={seg.key} className="size-legend-item">
                  <span className="size-legend-swatch" style={{ background: seg.color }} />
                  <span className="size-legend-label">
                    {seg.label} · <strong>{count}</strong> ({pct}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
