import { useState, useEffect, useMemo } from 'react'
import httpClient from '../api/httpClient'
import { useAuthentication } from '../hooks/useAuthentication'
import { useSyncAction } from '../hooks/useSyncAction'
import AppLayout from '../components/layout/AppLayout'
import PageContainer from '../components/layout/PageContainer'
import PageHeader from '../components/layout/PageHeader'
import LoadingScreen from '../components/common/LoadingScreen'
import SyncButton from '../components/common/SyncButton'
import PRSummaryCards from '../components/pulls/PRSummaryCards'
import StalePRPanel from '../components/pulls/StalePRPanel'
import PRSizeBreakdown from '../components/pulls/PRSizeBreakdown'
import PRList from '../components/pulls/PRList'
import type { PullRequestItem, PullRequestSummary } from '../types/pulls.types'

export default function PullsPage() {
  const { user } = useAuthentication()
  const [pulls, setPulls] = useState<PullRequestItem[]>([])
  const [summary, setSummary] = useState<PullRequestSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [pullsRes, summaryRes] = await Promise.all([
        httpClient.get('/github/pulls'),
        httpClient.get('/github/pulls/summary'),
      ])
      setPulls(pullsRes.data)
      setSummary(summaryRes.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const { syncing, lastSynced, markSynced, sync } = useSyncAction('/github/pulls/sync', fetchData)

  useEffect(() => { fetchData().then(markSynced) }, [markSynced])

  const uniqueRepoCount = useMemo(() => new Set(pulls.map(p => p.repo)).size, [pulls])

  if (loading) return <LoadingScreen message="Loading pull requests..." />

  return (
    <AppLayout rightContent={
      <SyncButton syncing={syncing} lastSynced={lastSynced} onSync={sync} />
    }>
      <PageContainer width="wide" tone="dashboard">
        <PageHeader
          label="pull requests"
          title="Your pull request history"
          meta={
            <>@{user?.username} · {summary
              ? `${summary.total_prs} pull requests across ${uniqueRepoCount} repositories`
              : 'All time'}</>
          }
        />

        <PRSummaryCards summary={summary} />
        {summary && <PRSizeBreakdown distribution={summary.size_distribution} />}
        <PRList pulls={pulls} />
        {summary && <StalePRPanel stalePrs={summary.stale_prs} />}
      </PageContainer>
    </AppLayout>
  )
}
