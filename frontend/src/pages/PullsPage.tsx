import { useState, useEffect, useMemo } from 'react'
import httpClient from '../api/httpClient'
import { useAuthentication } from '../hooks/useAuthentication'
import { useSyncAction } from '../hooks/useSyncAction'
import AppLayout from '../components/layout/AppLayout'
import PageContainer from '../components/layout/PageContainer'
import PageHeader from '../components/layout/PageHeader'
import SyncButton from '../components/common/SyncButton'
import { StatCardSkeleton, PanelSkeleton, SkeletonRegion } from '../components/common/Skeleton'
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

  // No setLoading(true) here on purpose. This runs on first load AND on
  // every sync; flipping loading back on would swap the populated page out
  // for the loading state and throw away the user's scroll position.
  const fetchData = async () => {
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

        {loading ? (
          <SkeletonRegion label="Loading pull requests">
            <div className="stats-grid">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
            <PanelSkeleton bodyHeight="60px" />
            <PanelSkeleton bodyHeight="220px" />
          </SkeletonRegion>
        ) : (
          <div className="stagger-in">
            <PRSummaryCards summary={summary} />
            {summary && <PRSizeBreakdown distribution={summary.size_distribution} />}
            <PRList pulls={pulls} />
            {summary && <StalePRPanel stalePrs={summary.stale_prs} />}
          </div>
        )}
      </PageContainer>
    </AppLayout>
  )
}
