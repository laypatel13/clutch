import type { LanguageBreakdown } from '../../types/dashboard.types'

const languageColors = [
  'var(--accent-purple)',
  'var(--accent-pink)',
  'var(--accent-cyan)',
  'var(--accent-green)',
  'var(--accent-yellow)',
]

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

interface LanguageBreakdownPanelProps {
  languages: LanguageBreakdown | null
}

export default function LanguageBreakdownPanel({ languages }: LanguageBreakdownPanelProps) {
  const top5 = languages
    ? Object.entries(languages).sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 5)
    : []

  return (
    <div className="nb-panel-cyan" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
        <span className="section-label" style={{ marginBottom: 0 }}>Language Breakdown</span>
        <span className="tag tag-outline">Top 5 Languages</span>
      </div>

      {top5.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
          {/* Left Column: Progress Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {top5.map(([name, detail], idx) => {
              const color = languageColors[idx % languageColors.length]
              return (
                <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {formatBytes(detail.bytes)} ({detail.percentage}%)
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '16px',
                    backgroundColor: 'var(--bg)',
                    border: '2px solid var(--border)',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${detail.percentage}%`,
                      height: '100%',
                      backgroundColor: color,
                      borderRight: detail.percentage < 100 ? '2px solid var(--border)' : 'none',
                      transition: 'width 0.6s ease-in-out'
                    }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column: Mini Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-3)', alignContent: 'start' }}>
            {top5.map(([name, detail], idx) => {
              const color = languageColors[idx % languageColors.length]
              return (
                <div key={name} className="nb-card" style={{
                  padding: 'var(--space-3)',
                  ['--card-accent' as any]: color,
                  background: 'var(--bg-card)',
                }}>
                  <div style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                    {name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-xl)', fontWeight: 700, color }}>
                    {detail.percentage}%
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    {formatBytes(detail.bytes)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <p style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-8) 0' }}>
          No language breakdown data — click Sync to load.
        </p>
      )}
    </div>
  )
}
