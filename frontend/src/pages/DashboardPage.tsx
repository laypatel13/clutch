import { useState, useEffect } from 'react'
import { useAuthentication } from '../hooks/useAuthentication'
import httpClient from '../api/httpClient'
import { RefreshCw } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import LoadingScreen from '../components/common/LoadingScreen'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import StatsGrid from '../components/dashboard/StatsGrid'
import CommitActivityChart from '../components/dashboard/CommitActivityChart'
import type { ActivitySummary, StreakSummary } from '../types/dashboard.types'

export default function DashboardPage() {
  const { user } = useAuthentication()
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
    <AppLayout rightContent={
      <button onClick={handleSync} disabled={syncing} className="btn-nb btn-grey" style={{ fontSize: 'var(--text-sm)', padding: '5px var(--space-3)', whiteSpace: 'nowrap' }}>
        <RefreshCw size={12} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none', flexShrink: 0 }} />
        {syncing ? 'Syncing...' : (getSyncedAgoText() || 'Sync now')}
      </button>
    }>
      <div className="page-container dashboard-content" style={{ maxWidth: '960px', margin: '0 auto', padding: 'var(--space-9) var(--space-8)' }}>
        <DashboardHeader name={user?.name} username={user?.username} />
        <StatsGrid streak={streak} />
        <CommitActivityChart chartData={chartData} />
      </div>
    </AppLayout>
  )
}