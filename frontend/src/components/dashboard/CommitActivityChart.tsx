import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import PanelHeader from '../common/PanelHeader'

interface CommitActivityChartProps {
  chartData: { date: string; commits: number }[]
}

const AXIS_TICK = {
  fontSize: 11,
  fill: 'var(--text-muted)',
  fontFamily: 'var(--font-mono)',
} as const

// Recharts renders the tooltip outside the CSS cascade we control, so its
// chrome is spelled out here — but from the same tokens as .nb-card.
const TOOLTIP_STYLE = {
  background: 'var(--bg-card)',
  border: '2px solid var(--accent-purple)',
  borderRadius: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  color: 'var(--text-primary)',
  boxShadow: '3px 3px 0px var(--accent-purple)',
} as const

export default function CommitActivityChart({ chartData }: CommitActivityChartProps) {
  return (
    <div className="nb-card nb-accent-purple panel">
      <PanelHeader
        label="commit activity"
        trailing={<span className="tag tag-outline">last 14 days</span>}
      />
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ stroke: 'var(--accent-purple)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Line
              type="monotone"
              dataKey="commits"
              stroke="var(--accent-purple)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: 'var(--accent-purple)', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: 'var(--accent-purple)', stroke: 'var(--bg-card)', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="empty-state">No activity data — click Sync to load.</p>
      )}
    </div>
  )
}
