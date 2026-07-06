import { useState, useEffect } from 'react'
import { useAuthentication } from '../hooks/useAuthentication'
import httpClient from '../api/httpClient'
import { GitCommit, GitPullRequest, Flame, Brain, RefreshCw, LogOut, BarChart3, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import NavigationBar from '../components/layout/NavigationBar'
import StatCard from '../components/common/StatCard'
import LoadingScreen from '../components/common/LoadingScreen'
import Heatmap from '../components/common/Heatmap'
import type { ActivitySummary, StreakSummary, WeeklyInsight, HeatmapData, LanguageBreakdown } from '../types/dashboard.types'

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const languageColors = [
  'var(--accent-purple)',
  'var(--accent-pink)',
  'var(--accent-cyan)',
  'var(--accent-green)',
  'var(--accent-yellow)',
]


export default function DashboardPage() {
  const { user, logout } = useAuthentication()
  const [activity, setActivity] = useState<ActivitySummary | null>(null)
  const [streak, setStreak] = useState<StreakSummary | null>(null)
  const [insight, setInsight] = useState<WeeklyInsight | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null)
  const [languages, setLanguages] = useState<LanguageBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [insightLoading, setInsightLoading] = useState(false)

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [activityRes, streakRes] = await Promise.all([
        httpClient.get('/github/activity?days=30'),
        httpClient.get('/github/streak'),
      ])
      setActivity(activityRes.data)
      setStreak(streakRes.data)
      setInsightLoading(true)
      httpClient.get('/insights/weekly')
        .then(r => setInsight(r.data))
        .catch(() => {})
        .finally(() => setInsightLoading(false))
      httpClient.get('/github/heatmap').then(r => setHeatmap(r.data)).catch(() => {})
      httpClient.get('/github/languages').then(r => setLanguages(r.data)).catch(() => {})
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleSync = async () => {
    setSyncing(true)
    await httpClient.post('/github/sync').catch(() => {})
    await fetchDashboardData()
    setSyncing(false)
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
          <button onClick={handleSync} disabled={syncing || insightLoading} className="btn-nb btn-ghost" style={{ fontSize: 'var(--text-sm)', padding: 'var(--space-2) var(--space-3)' }}>
            <RefreshCw size={12} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
          <a href={`/u/${user?.username}`}>
            <img src={user?.avatar_url || ''} alt={user?.username} style={{ width: '32px', height: '32px', border: '2px solid var(--border)',borderRadius: '50%',boxShadow: '2px 2px 0 var(--border)',objectFit: 'cover', cursor: 'pointer', display: 'block' }} />
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

        {/* LANGUAGE BREAKDOWN */}
        <div className="nb-panel-cyan" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <span className="section-label" style={{ marginBottom: 0 }}>Language Breakdown</span>
            <span className="tag tag-outline">Top 5 Languages</span>
          </div>

          {languages && Object.keys(languages).length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
              {/* Left Column: Progress Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {Object.entries(languages)
                  .sort((a, b) => b[1].bytes - a[1].bytes)
                  .slice(0, 5)
                  .map(([name, detail], idx) => {
                    const color = languageColors[idx % languageColors.length]
                    return (
                      <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{name}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
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
                {Object.entries(languages)
                  .sort((a, b) => b[1].bytes - a[1].bytes)
                  .slice(0, 5)
                  .map(([name, detail], idx) => {
                    const color = languageColors[idx % languageColors.length]
                    return (
                      <div key={name} className="nb-card" style={{
                        padding: 'var(--space-3)',
                        borderColor: color,
                        boxShadow: `3px 3px 0px ${color}`,
                        background: 'var(--bg-card)',
                      }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                          {name}
                        </div>
                        <div style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-xl)', fontWeight: 700, color }}>
                          {detail.percentage}%
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-secondary)' }}>
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
      </div>
    </div>
  )
}