import { useWaiting } from '../hooks/useWaiting'
import { countWaiting } from '../utils/waiting'
import AppLayout from '../components/layout/AppLayout'
import PageContainer from '../components/layout/PageContainer'
import PageHeader from '../components/layout/PageHeader'
import SyncButton from '../components/common/SyncButton'
import Waiting from '../components/waiting/Waiting'

export default function WaitingPage() {
  const waiting = useWaiting()
  const { data, status, refreshing, refresh } = waiting

  let meta: string
  if (!data) {
    meta = status === 'error' ? "Couldn't check GitHub" : 'Checking GitHub…'
  } else {
    const count = countWaiting(data)
    const { awaiting_maintainer: awaiting, probably_abandoned: abandoned } = data.sections
    meta = count === 0 ? 'All clear' : `${count} open ${count === 1 ? 'loop' : 'loops'}`
    if (awaiting.length > 0) meta += ` · ${awaiting.length} awaiting a maintainer`
    if (abandoned.length > 0) meta += ` · ${abandoned.length} probably abandoned`
  }

  return (
    <AppLayout rightContent={
      <SyncButton
        syncing={status === 'loading' || refreshing}
        lastSynced={data ? new Date(data.checked_at) : null}
        onSync={refresh}
      />
    }>
      <PageContainer width="wide" tone="dashboard">
        <PageHeader label="waiting on you" title="What's waiting on you" meta={meta} />
        <Waiting waiting={waiting} />
      </PageContainer>
    </AppLayout>
  )
}
