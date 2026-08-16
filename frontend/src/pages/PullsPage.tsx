import { useState, useEffect } from 'react'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import httpClient from '../api/httpClient'
import NavigationBar from '../components/layout/NavigationBar'
import LoadingScreen from '../components/common/LoadingScreen'
import PRSummaryCards from '../components/pulls/PRSummaryCards'
import StalePRPanel from '../components/pulls/StalePRPanel'
import PRSizeBreakdown from '../components/pulls/PRSizeBreakdown'
import PRList from '../components/pulls/PRList'
import type { PullRequestItem, PullRequestSummary } from '../types/pulls.types'

export default function PullsPage() {
  const [pulls, setPulls] = useState<PullRequestItem[]>([])
  const [summary, setSummary] = useState<PullRequestSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => { fetchData() }, [])

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

  const handleSync = async () => {
    setSyncing(true)
    await httpClient.post('/github/pulls/sync').catch(() => { })
    await fetchData()
    setSyncing(false)
  }

  if (loading) return <LoadingScreen message="Loading pull requests..." />

  return (
    <div style={{ minHeight: '100vh' }}>
      <NavigationBar rightContent={
        <>
          <a href="/dashboard" className="btn-nb btn-grey" style={{ fontSize: 'var(--text-sm)', padding: '5px var(--space-4)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={14} /> Dashboard
          </a>
          <button onClick={handleSync} disabled={syncing} className="btn-nb btn-grey" style={{ fontSize: 'var(--text-sm)', padding: '5px var(--space-3)', whiteSpace: 'nowrap' }}>
            <RefreshCw size={12} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none', flexShrink: 0 }} />
            {syncing ? 'Syncing...' : 'Sync pull requests'}
          </button>
        </>
      } />

      <div className="page-container dashboard-content" style={{ maxWidth: '960px', margin: '0 auto', padding: 'var(--space-9) var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-8)', paddingBottom: 'var(--space-6)', borderBottom: '2px solid var(--border)' }}>
          <div className="section-label">pull requests</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 'var(--text-4xl)', color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
            Your pull request history
          </h1>
        </div>

        <PRSummaryCards summary={summary} />
        {summary && <StalePRPanel stalePrs={summary.stale_prs} />}
        {summary && <PRSizeBreakdown distribution={summary.size_distribution} />}
        <PRList pulls={pulls} />
      </div>
    </div>
  )
}