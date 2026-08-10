import { Brain, RefreshCw } from 'lucide-react'
import type { WeeklyInsight } from '../../types/dashboard.types'

interface AIInsightPanelProps {
  insight: WeeklyInsight | null
  insightLoading: boolean
}

export default function AIInsightPanel({ insight, insightLoading }: AIInsightPanelProps) {
  return (
    <div className="nb-panel-pink" style={{ padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <span className="section-label" style={{ marginBottom: 0 }}>Weekly AI Insight</span>
        {insightLoading && (
          <RefreshCw size={12} color="var(--accent-pink)" style={{ animation: 'spin 1s linear infinite' }} />
        )}
        <span className="tag tag-pink" style={{ marginLeft: 'auto' }}>Groq</span>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        <Brain size={18} color="var(--accent-pink)" style={{ flexShrink: 0, marginTop: '3px' }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            {insightLoading
              ? 'Generating insight with Groq...'
              : (insight?.ai_summary || insight?.message || 'Sync your activity first to generate AI insights.')}
          </p>
          {insight?.stats && (
            <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
              {[
                { label: 'Best Day', value: insight.stats.best_day },
                { label: 'Commits', value: insight.stats.total_commits },
                { label: 'Active', value: `${insight.stats.active_days}/7` },
              ].map(item => (
                <div key={item.label}>
                  <p className="stat-label" style={{ marginBottom: 'var(--space-1)' }}>{item.label}</p>
                  <p style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--accent-pink)' }}>{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
