import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import httpClient from '../api/httpClient'
import type { TimelinePage } from '../types/timeline.types'
import { mergeFreshFirstPage, type TimelineFeed } from '../utils/timeline'

const PAGE_SIZE = 40

type LoadStatus = 'loading' | 'ready' | 'error'

async function requestPage(cursor?: string | null): Promise<TimelinePage> {
  const { data } = await httpClient.get<TimelinePage>('/github/timeline', {
    params: cursor ? { limit: PAGE_SIZE, cursor } : { limit: PAGE_SIZE },
  })
  return data
}

/**
 * Loads the activity timeline and keeps it in step with GitHub.
 *
 * On mount it shows what's already stored straight away, and syncs with GitHub
 * in the background at the same time — so the page is useful immediately and
 * current a moment later, without the user having to press Sync first.
 */
export function useTimeline() {
  const [feed, setFeed] = useState<TimelineFeed>({ items: [], nextCursor: null })
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [loadingEarlier, setLoadingEarlier] = useState(false)
  const [earlierFailed, setEarlierFailed] = useState(false)
  // Starts true: a sync begins the moment the page mounts.
  const [syncing, setSyncing] = useState(true)
  const [syncFailed, setSyncFailed] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  // Read by a polite live region, so updates are announced as complete phrases.
  const [announcement, setAnnouncement] = useState('')

  const loadFirstPage = useCallback(async () => {
    try {
      const page = await requestPage()
      setFeed({ items: page.items, nextCursor: page.next_cursor })
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  // Every state change here happens after an await, so this is safe to start
  // from an effect. The button handler below sets the "in progress" flags first.
  const runSync = useCallback(async () => {
    try {
      await httpClient.post('/github/events/sync')
      const fresh = await requestPage()
      setFeed(previous => mergeFreshFirstPage(previous, fresh))
      setStatus('ready')
      setLastSynced(new Date())
      setAnnouncement('Activity synced with GitHub')
    } catch {
      setSyncFailed(true)
      setAnnouncement("Couldn't refresh your activity from GitHub")
    } finally {
      setSyncing(false)
    }
  }, [])

  const sync = useCallback(() => {
    setSyncing(true)
    setSyncFailed(false)
    void runSync()
  }, [runSync])

  const retry = useCallback(() => {
    setStatus('loading')
    sync()
    void loadFirstPage()
  }, [sync, loadFirstPage])

  const loadEarlier = useCallback(async () => {
    if (!feed.nextCursor) return
    setLoadingEarlier(true)
    setEarlierFailed(false)
    try {
      const page = await requestPage(feed.nextCursor)
      setFeed(previous => {
        const seen = new Set(previous.items.map(item => item.id))
        return {
          items: [...previous.items, ...page.items.filter(item => !seen.has(item.id))],
          nextCursor: page.next_cursor,
        }
      })
      const count = page.items.length
      setAnnouncement(`Loaded ${count} earlier ${count === 1 ? 'item' : 'items'}`)
    } catch {
      setEarlierFailed(true)
      setAnnouncement("Couldn't load earlier activity")
    } finally {
      setLoadingEarlier(false)
    }
  }, [feed.nextCursor])

  const onMount = useEffectEvent(() => {
    void loadFirstPage()
    void runSync()
  })

  // StrictMode runs effects twice in development. Loading twice is harmless,
  // but two simultaneous syncs would race each other, so start only once.
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    onMount()
  }, [])

  return {
    items: feed.items,
    hasEarlier: feed.nextCursor !== null,
    status,
    loadingEarlier,
    earlierFailed,
    syncing,
    syncFailed,
    lastSynced,
    announcement,
    sync,
    retry,
    loadEarlier,
  }
}

export type TimelineState = ReturnType<typeof useTimeline>
