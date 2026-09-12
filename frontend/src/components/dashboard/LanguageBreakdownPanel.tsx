import PanelHeader from '../common/PanelHeader'
import type { AccentName } from '../common/StatCard'
import type { LanguageBreakdown } from '../../types/dashboard.types'

const LANGUAGE_ACCENTS: AccentName[] = ['purple', 'pink', 'cyan', 'green', 'yellow']

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
    <div className="nb-card nb-accent-cyan panel">
      <PanelHeader
        label="language breakdown"
        trailing={<span className="tag tag-outline">top 5 languages</span>}
      />

      {top5.length > 0 ? (
        <div className="lang-grid">
          <div className="lang-bars">
            {top5.map(([name, detail], idx) => {
              const accent = LANGUAGE_ACCENTS[idx % LANGUAGE_ACCENTS.length]
              return (
                <div key={name} className="lang-bar-row">
                  <div className="lang-bar-meta">
                    <span className="lang-bar-name">{name}</span>
                    <span className="meta-mono">
                      {formatBytes(detail.bytes)} ({detail.percentage}%)
                    </span>
                  </div>
                  <div className="lang-bar" style={{ borderColor: `var(--accent-${accent})` }}>
                    <div
                      className="lang-bar-fill"
                      style={{
                        // scaleX rather than width: the track is a fixed size,
                        // so this composites instead of re-laying-out per frame.
                        transform: `scaleX(${detail.percentage / 100})`,
                        background: `var(--accent-${accent})`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="lang-cards">
            {top5.map(([name, detail], idx) => {
              const accent = LANGUAGE_ACCENTS[idx % LANGUAGE_ACCENTS.length]
              return (
                <div key={name} className={`nb-card nb-accent-${accent} lang-card`}>
                  <div className="lang-card-name">{name}</div>
                  <div
                    className="lang-card-pct"
                    style={{ color: `var(--accent-${accent}-on-surface)` }}
                  >
                    {detail.percentage}%
                  </div>
                  <div className="lang-card-bytes">{formatBytes(detail.bytes)}</div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="empty-state">No language breakdown data — click Sync to load.</p>
      )}
    </div>
  )
}
