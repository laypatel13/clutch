import type { PRSizeDistribution } from '../../types/pulls.types'

interface PRSizeBreakdownProps {
  distribution: PRSizeDistribution
}

const SEGMENTS: { key: keyof PRSizeDistribution; label: string; color: string }[] = [
  { key: 'small', label: 'Small (<50 lines)', color: '#f97316' },
  { key: 'medium', label: 'Medium (50-300)', color: '#7c3aed' },
  { key: 'large', label: 'Large (300+)', color: '#e8185a' },
]

export default function PRSizeBreakdown({ distribution }: PRSizeBreakdownProps) {
  const total = distribution.small + distribution.medium + distribution.large
  const segments = SEGMENTS
    .map(seg => ({ ...seg, count: distribution[seg.key] }))
    .filter(s => s.count > 0)

  return (
    <div className="nb-panel-cyan" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
        <span className="section-label" style={{ marginBottom: 0 }}>pull request size mix</span>
        <span className="tag tag-outline">{total} total</span>
      </div>
      {total === 0 ? (
        <p style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No synced pull requests yet.</p>
      ) : (
        <div>
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '18px',
              overflow: 'hidden',
              background: 'var(--bg-panel)',
              border: '2px solid #6b7280',
              boxShadow: '3px 3px 0px #6b7280',
            }}
          >
            {segments.map((seg, idx) => {
              const pct = (seg.count / total) * 100
              return (
                <div
                  key={seg.key}
                  title={`${seg.label} · ${seg.count} (${Math.round(pct)}%)`}
                  style={{
                    width: `${pct}%`,
                    background: seg.color,
                    borderRight: idx < segments.length - 1 ? '2px solid var(--bg-panel)' : 'none',
                    transition: 'width 0.3s ease',
                  }}
                />
              )
            })}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-5)', marginTop: 'var(--space-5)' }}>
            {SEGMENTS.map(seg => {
              const count = distribution[seg.key]
              if (count === 0) return null
              const pct = Math.round((count / total) * 100)
              return (
                <div key={seg.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      background: seg.color,
                      display: 'inline-block',
                      flexShrink: 0,
                      border: '1px solid #6b7280',
                      boxShadow: '2px 2px 0px #6b7280',
                    }}
                  />
                  <span style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    {seg.label} · <strong style={{ color: 'var(--text-primary)' }}>{count}</strong> ({pct}%)
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