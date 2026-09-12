import { useState, useEffect } from 'react'
import { useAuthentication } from '../hooks/useAuthentication'
import { useSyncAction } from '../hooks/useSyncAction'
import httpClient from '../api/httpClient'
import AppLayout from '../components/layout/AppLayout'
import PageContainer from '../components/layout/PageContainer'
import LoadingScreen from '../components/common/LoadingScreen'
import SyncButton from '../components/common/SyncButton'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import StatsGrid from '../components/dashboard/StatsGrid'
import CommitActivityChart from '../components/dashboard/CommitActivityChart'
import type { ActivitySummary, StreakSummary } from '../types/dashboard.types'

export default function DashboardPage() {
  const { user } = useAuthentication()
  const [activity, setActivity] = useState<ActivitySummary | null>(null)
  const [streak, setStreak] = useState<StreakSummary | null>(null)
  const [loading, setLoading] = useState(true)

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

  const { syncing, lastSynced, markSynced, sync } = useSyncAction('/github/sync', fetchDashboardData)

  useEffect(() => { fetchDashboardData().then(markSynced) }, [markSynced])

  if (loading) return <LoadingScreen message="Loading activity..." />

  const chartData = activity?.daily_activity
    ?.sort((a, b) => a.date.localeCompare(b.date))
    ?.slice(-14)
    ?.map(d => ({ date: d.date.slice(5), commits: d.commits })) || []

  return (
    <AppLayout rightContent={
      <SyncButton syncing={syncing} lastSynced={lastSynced} onSync={sync} />
    }>
      <PageContainer width="wide" tone="dashboard">
        <DashboardHeader name={user?.name} username={user?.username} />
        <StatsGrid streak={streak} />
        <CommitActivityChart chartData={chartData} />
      </PageContainer>
    </AppLayout>
  )
}
