import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
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
  const chartData = SEGMENTS
    .map(seg => ({ name: seg.label, value: distribution[seg.key], color: seg.color }))
    .filter(d => d.value > 0)

  return (
    <div className="nb-panel-cyan" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
        <span className="section-label" style={{ marginBottom: 0 }}>pull request size mix</span>
        <span className="tag tag-outline">{total} total</span>
      </div>
      {total === 0 ? (
        <p style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No synced pull requests yet.</p>
      ) : (
        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 150, height: 150, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={70}
                  stroke="var(--border)"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '2px solid var(--accent-cyan)', borderRadius: 0, fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)', boxShadow: '4px 4px 0px var(--accent-cyan)' }}
                  formatter={(value, name) => [`${value} (${Math.round((Number(value) / total) * 100)}%)`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontFamily: 'var(--font-chrome)', fontWeight: 700, fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}>{total}</div>
              <div className="stat-label">PRs</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 180 }}>
            {SEGMENTS.map(seg => {
              const count = distribution[seg.key]
              if (count === 0) return null
              return (
                <div key={seg.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ width: '10px', height: '10px', background: seg.color, border: '1px solid var(--border)', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {seg.label} · {count} ({Math.round((count / total) * 100)}%)
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