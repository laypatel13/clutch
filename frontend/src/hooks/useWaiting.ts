import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import httpClient from '../api/httpClient'
import type { WaitingResponse } from '../types/waiting.types'
import { countWaiting } from '../utils/waiting'

type LoadStatus = 'loading' | 'ready' | 'error'

/**
 * Loads what's waiting on the user. Always live — the server asks GitHub on
 * every request — so there's no separate sync step, only refresh.
 */
export function useWaiting() {
  const [data, setData] = useState<WaitingResponse | null>(null)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshFailed, setRefreshFailed] = useState(false)
  // Read by a polite live region, so updates are announced as complete phrases.
  const [announcement, setAnnouncement] = useState('')

  // Every state change happens after an await, so this is safe to start from
  // an effect. The handlers below set the "in progress" flags first.
  const runFetch = useCallback(async () => {
    try {
      const { data: response } = await httpClient.get<WaitingResponse>('/github/waiting')
      setData(response)
      setStatus('ready')
      setRefreshFailed(false)
      const count = countWaiting(response)
      setAnnouncement(count === 0 ? 'Nothing is waiting on you' : `${count} ${count === 1 ? 'thing' : 'things'} waiting on you`)
    } catch {
      // Keep whatever was already on screen; only a failed first load is an error page.
      setStatus(previous => (previous === 'ready' ? 'ready' : 'error'))
      setRefreshFailed(true)
      setAnnouncement("Couldn't check GitHub for what's waiting on you")
    } finally {
      setRefreshing(false)
    }
  }, [])

  const refresh = useCallback(() => {
    setRefreshing(true)
    void runFetch()
  }, [runFetch])

  const retry = useCallback(() => {
    setStatus('loading')
    refresh()
  }, [refresh])

  const onMount = useEffectEvent(() => {
    void runFetch()
  })

  // StrictMode runs effects twice in development; one request is enough.
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    onMount()
  }, [])

  return { data, status, refreshing, refreshFailed, announcement, refresh, retry }
}

export type WaitingState = ReturnType<typeof useWaiting>
