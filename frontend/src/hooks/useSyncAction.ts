import { useCallback, useState } from 'react'
import httpClient from '../api/httpClient'

/**
 * Drives a "sync from GitHub then reload" control. Dashboard and Pulls differ
 * only in which endpoint they POST to and what they refetch afterwards.
 */
export function useSyncAction(endpoint: string, refetch: () => Promise<void>) {
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)

  // Stable, so callers can list it as an effect dependency without retriggering.
  const markSynced = useCallback(() => setLastSynced(new Date()), [])

  const sync = async () => {
    setSyncing(true)
    await httpClient.post(endpoint).catch(() => { })
    await refetch()
    markSynced()
    setSyncing(false)
  }

  return { syncing, lastSynced, markSynced, sync }
}
