import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PageHeader from '../layout/PageHeader'

interface DashboardHeaderProps {
  name?: string | null
  username?: string
}

export default function DashboardHeader({ name, username }: DashboardHeaderProps) {
  return (
    <PageHeader
      label="dashboard"
      title={name || username}
      meta={
        <>
          @{username} · Last 30 days ·{' '}
          <Link to={`/u/${username}`} className="inline-link">
            Public profile <ArrowRight size={13} />
          </Link>
        </>
      }
    />
  )
}
