import { useState, useEffect } from 'react'
import { useAuthentication } from '../hooks/useAuthentication'
import httpClient from '../api/httpClient'
import { RefreshCw, LogOut } from 'lucide-react'
import NavigationBar from '../components/layout/NavigationBar'
import LoadingScreen from '../components/common/LoadingScreen'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import StatsGrid from '../components/dashboard/StatsGrid'
import CommitActivityChart from '../components/dashboard/CommitActivityChart'
import type { ActivitySummary, StreakSummary } from '../types/dashboard.types'

export default function DashboardPage() {
  const { user, logout } = useAuthentication()
  const [activity, setActivity] = useState<ActivitySummary | null>(null)
  const [streak, setStreak] = useState<StreakSummary | null>(null)
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
    if (diffMin < 1) return 'Just synced'
    if (diffMin === 1) return '1min ago'
    if (diffMin < 60) return `${diffMin}min ago`
    const diffHr = Math.floor(diffMin / 60)
    return `${diffHr}hour ago`
  }

  if (loading) return <LoadingScreen message="Loading activity..." />

  const chartData = activity?.daily_activity
    ?.sort((a, b) => a.date.localeCompare(b.date))
    ?.slice(-14)
    ?.map(d => ({ date: d.date.slice(5), commits: d.commits })) || []

  return (
    <div style={{ minHeight: '100vh' }}>
      <NavigationBar rightContent={
        <>
          <a href="/pulls" className="btn-nb btn-grey" style={{ fontSize: 'var(--text-sm)', padding: '5px var(--space-4)', whiteSpace: 'nowrap' }}>
            Pull Requests
          </a>
          <button onClick={handleSync} disabled={syncing} className="btn-nb btn-grey" style={{ fontSize: 'var(--text-sm)', padding: '5px var(--space-3)', whiteSpace: 'nowrap' }}>
            <RefreshCw size={12} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none', flexShrink: 0 }} />
            {syncing ? 'Syncing...' : (getSyncedAgoText() || 'Sync now')}
          </button>
          <a href={`/u/${user?.username}`}>
            <img src={user?.avatar_url || ''} alt={user?.username} style={{ width: '32px', height: '32px', border: '2px solid var(--border)',borderRadius: '50%',boxShadow: '2px 2px 0 var(--border)',objectFit: 'cover', cursor: 'pointer', display: 'block' }} />
          </a>
          <button onClick={logout} className="btn-nb btn-pink" style={{ fontSize: 'var(--text-sm)', padding: 'var(--space-2) var(--space-3)' }}>
            <LogOut size={12} />
          </button>
        </>
      } />

      <div className="page-container dashboard-content" style={{ maxWidth: '960px', margin: '0 auto', padding: 'var(--space-9) var(--space-8)' }}>
        <DashboardHeader name={user?.name} username={user?.username} />
        <StatsGrid streak={streak} />
        <CommitActivityChart chartData={chartData} />
      </div>
    </div>
  )
}