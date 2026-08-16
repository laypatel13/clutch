import type { PRSizeDistribution } from '../../types/pulls.types'

interface PRSizeBreakdownProps {
  distribution: PRSizeDistribution
}

const SEGMENTS: { key: keyof PRSizeDistribution; label: string; color: string }[] = [
  { key: 'small', label: 'Small (<50 lines)', color: 'var(--accent-green)' },
  { key: 'medium', label: 'Medium (50-300)', color: 'var(--accent-cyan)' },
  { key: 'large', label: 'Large (300+)', color: 'var(--accent-pink)' },
]

export default function PRSizeBreakdown({ distribution }: PRSizeBreakdownProps) {
  const total = distribution.small + distribution.medium + distribution.large

  return (
    <div className="nb-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
      <span className="section-label">PR Size Mix</span>
      {total === 0 ? (
        <p style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No synced PRs yet.</p>
      ) : (
        <>
          <div style={{ display: 'flex', height: '14px', border: '2px solid var(--border)', overflow: 'hidden', marginBottom: 'var(--space-4)' }}>
            {SEGMENTS.map(seg => {
              const count = distribution[seg.key]
              if (count === 0) return null
              return <div key={seg.key} style={{ width: `${(count / total) * 100}%`, background: seg.color }} />
            })}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
            {SEGMENTS.map(seg => (
              <div key={seg.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ width: '10px', height: '10px', background: seg.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {seg.label} · {distribution[seg.key]}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
