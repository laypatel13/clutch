import { RefreshCw } from 'lucide-react'

interface SyncButtonProps {
  syncing: boolean
  lastSynced: Date | null
  onSync: () => void
}

function formatSyncedAgo(lastSynced: Date | null) {
  if (!lastSynced) return null
  const diffMin = Math.floor((Date.now() - lastSynced.getTime()) / 60000)
  if (diffMin < 1) return 'Just synced'
  if (diffMin === 1) return '1min ago'
  if (diffMin < 60) return `${diffMin}min ago`
  return `${Math.floor(diffMin / 60)}hour ago`
}

export default function SyncButton({ syncing, lastSynced, onSync }: SyncButtonProps) {
  return (
    <button onClick={onSync} disabled={syncing} className="btn-nb btn-grey btn-sm">
      <RefreshCw size={12} className={syncing ? 'sync-icon spinning' : 'sync-icon'} />
      {syncing ? 'Syncing...' : (formatSyncedAgo(lastSynced) || 'Sync now')}
    </button>
  )
}
