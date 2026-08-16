import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface CommitActivityChartProps {
  chartData: { date: string; commits: number }[]
}

export default function CommitActivityChart({ chartData }: CommitActivityChartProps) {
  return (
    <div className="nb-panel-purple" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
        <span className="section-label" style={{ marginBottom: 0 }}>Commit Activity</span>
        <span className="tag tag-outline">Last 14 days</span>
      </div>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '2px solid var(--accent-purple)', borderRadius: 0, fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)', boxShadow: '4px 4px 0px var(--accent-purple)' }} cursor={{ stroke: 'var(--accent-purple)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Line type="monotone" dataKey="commits" stroke="var(--accent-purple)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--accent-purple)', strokeWidth: 0 }} activeDot={{ r: 5, fill: 'var(--accent-purple)', stroke: 'var(--bg-card)', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-8) 0' }}>
          No activity data — click Sync to load.
        </p>
      )}
    </div>
  )
}
