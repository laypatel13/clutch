import { Brain, RefreshCw } from 'lucide-react'
import PanelHeader from '../common/PanelHeader'
import type { WeeklyInsight } from '../../types/dashboard.types'

interface AIInsightPanelProps {
  insight: WeeklyInsight | null
  insightLoading: boolean
}

export default function AIInsightPanel({ insight, insightLoading }: AIInsightPanelProps) {
  return (
    <div className="nb-card nb-accent-pink panel">
      <PanelHeader
        label="weekly ai insight"
        trailing={
          <div className="panel-header-trailing">
            {insightLoading && (
              <RefreshCw size={12} color="var(--accent-pink-on-surface)" className="spinning" />
            )}
            <span className="tag tag-pink">Groq</span>
          </div>
        }
      />
      <div className="insight-body">
        <Brain size={18} color="var(--accent-pink-on-surface)" className="insight-icon" />
        <div className="flex-fill">
          <p className="body-text">
            {insightLoading
              ? 'Generating insight with Groq...'
              : (insight?.ai_summary || insight?.message || 'Sync your activity first to generate AI insights.')}
          </p>
          {insight?.stats && (
            <div className="insight-stats">
              {[
                { label: 'best day', value: insight.stats.best_day },
                { label: 'commits', value: insight.stats.total_commits },
                { label: 'active', value: `${insight.stats.active_days}/7` },
              ].map(item => (
                <div key={item.label}>
                  <p className="stat-label insight-stat-label">{item.label}</p>
                  <p className="insight-stat-value">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
