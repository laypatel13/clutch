import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PageHeader from '../layout/PageHeader'
import StreakStrip from './StreakStrip'

interface DashboardHeaderProps {
  name?: string | null
  username?: string
}

export default function DashboardHeader({ name, username }: DashboardHeaderProps) {
  return (
    <PageHeader
      label="today"
      title={name || username}
      meta={
        <>
          @{username} ·{' '}
          <Link to={`/u/${username}`} className="inline-link">
            Public profile <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </>
      }
    >
      <StreakStrip />
    </PageHeader>
  )
}
