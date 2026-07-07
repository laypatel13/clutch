import { useState, useEffect } from 'react'
import { useAuthentication } from '../hooks/useAuthentication'
import httpClient from '../api/httpClient'
import { GitCommit, GitPullRequest, Flame, Brain, RefreshCw, LogOut, BarChart3, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import NavigationBar from '../components/layout/NavigationBar'
import StatCard from '../components/common/StatCard'
import LoadingScreen from '../components/common/LoadingScreen'
import Heatmap from '../components/common/Heatmap'
import type { ActivitySummary, StreakSummary, WeeklyInsight, HeatmapData } from '../types/dashboard.types'

export default function DashboardPage() {
  const { user, logout } = useAuthentication()
  const [activity, setActivity] = useState<ActivitySummary | null>(null)
  const [streak, setStreak] = useState<StreakSummary | null>(null)
  const [insight, setInsight] = useState<WeeklyInsight | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => { fetchDashboardData().then(() => setLastSynced(new Date())) }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [activityRes, streakRes] = await Promise.all([
        httpClient.get('/github/activity?days=30'),
        httpClient.get('/github/streak'),
      ])
      setActivity(activityRes.data)
      setStreak(streakRes.data)
      httpClient.get('/insights/weekly').then(r => setInsight(r.data)).catch(() => { })
      httpClient.get('/github/heatmap').then(r => setHeatmap(r.data)).catch(() => { })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleSync = async () => {
    setSyncing(true)
    await httpClient.post('/github/sync').catch(() => { })
    await fetchDashboardData()
    setLastSynced(new Date())
    setSyncing(false)
  }

  const getSyncedAgoText = () => {
    if (!lastSynced) return null
    const diffMs = Date.now() - lastSynced.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Last synced just now'
    if (diffMin === 1) return 'Last synced 1m ago'
    if (diffMin < 60) return `Last synced ${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    return `Last synced ${diffHr}h ago`
  }

  if (loading) return <LoadingScreen message="Loading activity..." />

  const chartData = activity?.daily_activity
    ?.sort((a, b) => a.date.localeCompare(b.date))
    ?.slice(-14)
    ?.map(d => ({ date: d.date.slice(5), commits: d.commits })) || []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <NavigationBar rightContent={
        <>
          <button onClick={handleSync} disabled={syncing} className="btn-nb btn-ghost" style={{ fontSize: 'var(--text-sm)', padding: 'var(--space-2) var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <RefreshCw size={12} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? 'Syncing...' : (getSyncedAgoText() || 'Sync now')}
          </button>
          <a href={`/u/${user?.username}`}>
            <img src={user?.avatar_url || ''} alt={user?.username} style={{ width: '32px', height: '32px', border: '2px solid var(--border)', cursor: 'pointer', display: 'block' }} />
          </a>
          <button onClick={logout} className="btn-nb btn-pink" style={{ fontSize: 'var(--text-sm)', padding: 'var(--space-2) var(--space-3)' }}>
            <LogOut size={12} />
          </button>
        </>
      } />

      <div className="page-container" style={{ maxWidth: '960px', margin: '0 auto', padding: 'var(--space-9) var(--space-8)' }}>

        {/* HEADER */}
        <div style={{ marginBottom: 'var(--space-8)', paddingBottom: 'var(--space-6)', borderBottom: '2px solid var(--border)' }}>
          <div className="section-label">Dashboard</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-4xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
            {user?.name || user?.username}
          </h1>
          <div style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            @{user?.username} · Last 30 days ·{' '}
            <a href={`/u/${user?.username}`} style={{ color: 'var(--accent-purple)', textDecoration: 'none' }}>Public profile →</a>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <StatCard label="Commits" value={activity?.total_commits ?? '—'} icon={<GitCommit size={13} />} color="purple" />
          <StatCard label="Pull Requests" value={activity?.total_prs ?? '—'} icon={<GitPullRequest size={13} />} color="pink" />
          <StatCard label="Streak" value={streak ? `${streak.current_streak}d` : '—'} icon={<Flame size={13} />} color="yellow" />
          <StatCard label="Best Streak" value={streak ? `${streak.longest_streak}d` : '—'} icon={<BarChart3 size={13} />} color="cyan" />
          <StatCard label="Active Days" value={streak?.total_active_days ?? '—'} icon={<Calendar size={13} />} color="green" />
        </div>

        {/* CHART */}
        <div className="nb-panel-purple" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <span className="section-label" style={{ marginBottom: 0 }}>Commit Activity</span>
            <span className="tag tag-outline">Last 14 days</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={chartData} barSize={10}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '2px solid var(--accent-purple)', borderRadius: 0, fontFamily: 'JetBrains Mono', fontSize: '12px', color: 'var(--text-primary)', boxShadow: '4px 4px 0px var(--accent-purple)' }} cursor={{ fill: 'rgba(124,58,237,0.06)' }} />
                <Bar dataKey="commits" fill="var(--accent-purple)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-8) 0' }}>
              No activity data — click Sync to load.
            </p>
          )}
        </div>

        {/* HEATMAP */}
        <div className="nb-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)', borderColor: 'var(--accent-yellow)', boxShadow: '5px 5px 0px var(--accent-yellow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <span className="section-label" style={{ marginBottom: 0 }}>Contribution Heatmap</span>
            <span className="tag tag-outline">
              {heatmap ? `${heatmap.total_contributions} in the last year` : 'Last 12 months'}
            </span>
          </div>
          <Heatmap data={heatmap} />
        </div>

        {/* AI INSIGHT */}
        <div className="nb-panel-pink" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <span className="section-label" style={{ marginBottom: 0 }}>Weekly AI Insight</span>
            <span className="tag tag-pink" style={{ marginLeft: 'auto' }}>Groq</span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
            <Brain size={18} color="var(--accent-pink)" style={{ flexShrink: 0, marginTop: '3px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                {insight?.ai_summary || insight?.message || 'Sync your activity first to generate AI insights.'}
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
      </div>
    </div>
  )
}