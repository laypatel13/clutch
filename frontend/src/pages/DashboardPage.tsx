import { useAuthentication } from '../hooks/useAuthentication'
import { useTimeline } from '../hooks/useTimeline'
import AppLayout from '../components/layout/AppLayout'
import PageContainer from '../components/layout/PageContainer'
import SyncButton from '../components/common/SyncButton'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import Timeline from '../components/timeline/Timeline'

export default function DashboardPage() {
  const { user } = useAuthentication()
  const timeline = useTimeline()

  return (
    <AppLayout rightContent={
      <SyncButton syncing={timeline.syncing} lastSynced={timeline.lastSynced} onSync={timeline.sync} />
    }>
      <PageContainer width="wide" tone="dashboard">
        <DashboardHeader name={user?.name} username={user?.username} />
        <Timeline timeline={timeline} />
      </PageContainer>
    </AppLayout>
  )
}
